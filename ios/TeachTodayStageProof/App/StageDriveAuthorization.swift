import AuthenticationServices
import CryptoKit
import Foundation
import Security
import UIKit

/// Keeps the long-lived Google Drive grant in the iPad Keychain. The hosted
/// page receives only short-lived access tokens, never the refresh token.
@MainActor
final class StageDriveAuthorization: NSObject {
    static let shared = StageDriveAuthorization()

    private let clientID = "506415947825-7tbcjhkpkiae9883tfc9eeoi6cjcpk31.apps.googleusercontent.com"
    private let driveScope = "https://www.googleapis.com/auth/drive.file"
    private let keychainService = "io.goosefraba.TeachTodayStageProof.drive"
    private let keychainAccount = "google-refresh-token"
    private var authSession: ASWebAuthenticationSession?
    private var presentationContextProvider: StageDrivePresentationContext?

    private var callbackScheme: String {
        "com.googleusercontent.apps.\(clientID.replacingOccurrences(of: ".apps.googleusercontent.com", with: ""))"
    }

    private var redirectURL: String { "\(callbackScheme):/oauth2redirect" }

    func accessToken(interactive: Bool, from controller: UIViewController) async throws -> String {
        if let refreshToken = try keychainRefreshToken() {
            return try await refreshAccessToken(refreshToken)
        }
        guard interactive else {
            throw StageDriveError.authorizationRequired
        }
        return try await authorize(from: controller)
    }

    private func authorize(from controller: UIViewController) async throws -> String {
        let verifier = Self.randomVerifier()
        let challenge = Self.codeChallenge(for: verifier)
        var components = URLComponents(string: "https://accounts.google.com/o/oauth2/v2/auth")!
        components.queryItems = [
            URLQueryItem(name: "client_id", value: clientID),
            URLQueryItem(name: "redirect_uri", value: redirectURL),
            URLQueryItem(name: "response_type", value: "code"),
            URLQueryItem(name: "scope", value: driveScope),
            URLQueryItem(name: "access_type", value: "offline"),
            URLQueryItem(name: "prompt", value: "consent"),
            URLQueryItem(name: "code_challenge", value: challenge),
            URLQueryItem(name: "code_challenge_method", value: "S256")
        ]
        guard let url = components.url else { throw StageDriveError.invalidAuthorizationURL }

        let callbackURL: URL = try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<URL, Error>) in
            let session = ASWebAuthenticationSession(url: url, callbackURLScheme: callbackScheme) { [weak self] callbackURL, error in
                self?.authSession = nil
                self?.presentationContextProvider = nil
                if let error { continuation.resume(throwing: error); return }
                guard let callbackURL else { continuation.resume(throwing: StageDriveError.missingAuthorizationCode); return }
                continuation.resume(returning: callbackURL)
            }
            let contextProvider = StageDrivePresentationContext(controller: controller)
            presentationContextProvider = contextProvider
            session.presentationContextProvider = contextProvider
            session.prefersEphemeralWebBrowserSession = false
            authSession = session
            guard session.start() else {
                authSession = nil
                presentationContextProvider = nil
                continuation.resume(throwing: StageDriveError.authorizationDidNotStart)
                return
            }
        }
        let code = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)?
            .queryItems?.first(where: { $0.name == "code" })?.value
        guard let code, !code.isEmpty else { throw StageDriveError.missingAuthorizationCode }
        let token = try await exchangeAuthorizationCode(code, verifier: verifier)
        if let refreshToken = token.refreshToken, !refreshToken.isEmpty {
            try saveRefreshToken(refreshToken)
        }
        guard !token.accessToken.isEmpty else { throw StageDriveError.missingAccessToken }
        return token.accessToken
    }

    private func exchangeAuthorizationCode(_ code: String, verifier: String) async throws -> StageDriveTokenResponse {
        try await requestToken([
            "client_id": clientID,
            "code": code,
            "code_verifier": verifier,
            "grant_type": "authorization_code",
            "redirect_uri": redirectURL
        ])
    }

    private func refreshAccessToken(_ refreshToken: String) async throws -> String {
        do {
            let response = try await requestToken([
                "client_id": clientID,
                "grant_type": "refresh_token",
                "refresh_token": refreshToken
            ])
            guard !response.accessToken.isEmpty else { throw StageDriveError.missingAccessToken }
            return response.accessToken
        } catch {
            if let urlError = error as? StageDriveHTTPError, urlError.body.contains("invalid_grant") {
                try? deleteRefreshToken()
                throw StageDriveError.authorizationRequired
            }
            throw error
        }
    }

    private func requestToken(_ values: [String: String]) async throws -> StageDriveTokenResponse {
        var request = URLRequest(url: URL(string: "https://oauth2.googleapis.com/token")!)
        request.httpMethod = "POST"
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")
        request.httpBody = values.map { key, value in
            "\(Self.formEncode(key))=\(Self.formEncode(value))"
        }.sorted().joined(separator: "&").data(using: .utf8)
        let (data, response) = try await URLSession.shared.data(for: request)
        let body = String(data: data, encoding: .utf8) ?? ""
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw StageDriveHTTPError(body: body)
        }
        return try JSONDecoder().decode(StageDriveTokenResponse.self, from: data)
    }

    private func keychainRefreshToken() throws -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount,
            kSecReturnData as String: true
        ]
        var result: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess, let data = result as? Data, let token = String(data: data, encoding: .utf8) else {
            throw StageDriveError.keychainFailure(status)
        }
        return token
    }

    private func saveRefreshToken(_ token: String) throws {
        try? deleteRefreshToken()
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount,
            kSecValueData as String: Data(token.utf8),
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        ]
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else { throw StageDriveError.keychainFailure(status) }
    }

    private func deleteRefreshToken() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: keychainAccount
        ]
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else { throw StageDriveError.keychainFailure(status) }
    }

    private static func randomVerifier() -> String {
        var bytes = [UInt8](repeating: 0, count: 48)
        _ = SecRandomCopyBytes(kSecRandomDefault, bytes.count, &bytes)
        return Data(bytes).base64URLEncodedString()
    }

    private static func codeChallenge(for verifier: String) -> String {
        Data(SHA256.hash(data: Data(verifier.utf8))).base64URLEncodedString()
    }

    private static func formEncode(_ value: String) -> String {
        value.addingPercentEncoding(withAllowedCharacters: .alphanumerics) ?? value
    }
}

@MainActor
private final class StageDrivePresentationContext: NSObject, ASWebAuthenticationPresentationContextProviding {
    weak var controller: UIViewController?
    init(controller: UIViewController) { self.controller = controller }
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        controller?.view.window ?? ASPresentationAnchor()
    }
}

private struct StageDriveTokenResponse: Decodable {
    let accessToken: String
    let refreshToken: String?
    enum CodingKeys: String, CodingKey { case accessToken = "access_token", refreshToken = "refresh_token" }
}

private struct StageDriveHTTPError: Error { let body: String }

enum StageDriveError: LocalizedError {
    case authorizationRequired, invalidAuthorizationURL, authorizationDidNotStart, missingAuthorizationCode, missingAccessToken, keychainFailure(OSStatus)
    var errorDescription: String? {
        switch self {
        case .authorizationRequired: return "Connect Google Drive backup once in Records to authorize this iPad."
        case .invalidAuthorizationURL: return "Google Drive authorization could not start."
        case .authorizationDidNotStart: return "Google Drive authorization could not open."
        case .missingAuthorizationCode: return "Google Drive did not return an authorization code."
        case .missingAccessToken: return "Google Drive did not return an access token."
        case .keychainFailure: return "This iPad could not securely store the Google Drive connection."
        }
    }
}

private extension Data {
    func base64URLEncodedString() -> String {
        base64EncodedString().replacingOccurrences(of: "+", with: "-").replacingOccurrences(of: "/", with: "_").replacingOccurrences(of: "=", with: "")
    }
}
