import UIKit
import WebKit
import CryptoKit

private final class WeakScriptMessageHandler: NSObject, WKScriptMessageHandler {
    weak var delegate: WKScriptMessageHandler?

    init(delegate: WKScriptMessageHandler) {
        self.delegate = delegate
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        delegate?.userContentController(userContentController, didReceive: message)
    }
}

final class TeacherWebViewController: UIViewController {
    private let messageName = "teachTodayStage"
    private let projectionMessageName = "teachTodayProjectionMode"
    private let backupMessageName = "teachTodayBackup"
    private let webView: WKWebView
    private let progressView = UIProgressView(progressViewStyle: .bar)
    private let errorView = UIView()
    private let errorLabel = UILabel()
    private var progressObservation: NSKeyValueObservation?
    private weak var popupController: PopupWebViewController?
    private var mirrorTimer: Timer?
    private var snapshotInFlight = false
    private let backupQueue = DispatchQueue(
        label: "io.goosefraba.TeachTodayStageProof.backup",
        qos: .utility
    )

    init() {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.userContentController.addUserScript(WKUserScript(
            source: "document.documentElement.dataset.teachTodayNative = 'ipad'; document.documentElement.dataset.teachTodayNativeBackup = '1';",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))
        webView = WKWebView(frame: .zero, configuration: configuration)
        super.init(nibName: nil, bundle: nil)
        configuration.userContentController.add(WeakScriptMessageHandler(delegate: self), name: messageName)
        configuration.userContentController.add(WeakScriptMessageHandler(delegate: self), name: projectionMessageName)
        configuration.userContentController.add(WeakScriptMessageHandler(delegate: self), name: backupMessageName)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    deinit {
        mirrorTimer?.invalidate()
        webView.configuration.userContentController.removeScriptMessageHandler(forName: messageName)
        webView.configuration.userContentController.removeScriptMessageHandler(forName: projectionMessageName)
        webView.configuration.userContentController.removeScriptMessageHandler(forName: backupMessageName)
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        configureView()
        loadTeachToday()
    }

    private func configureView() {
        view.backgroundColor = UIColor(red: 0.98, green: 0.97, blue: 0.95, alpha: 1)

        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = true
        webView.scrollView.contentInsetAdjustmentBehavior = .never
#if DEBUG
        if #available(iOS 16.4, *) { webView.isInspectable = true }
#endif
        view.addSubview(webView)

        progressView.translatesAutoresizingMaskIntoConstraints = false
        progressView.progressTintColor = UIColor(red: 0.04, green: 0.49, blue: 0.45, alpha: 1)
        view.addSubview(progressView)

        configureErrorView()

        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            progressView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            progressView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            progressView.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])

        progressObservation = webView.observe(\.estimatedProgress, options: [.initial, .new]) { [weak self] webView, _ in
            guard let self else { return }
            progressView.progress = Float(webView.estimatedProgress)
            progressView.isHidden = webView.estimatedProgress >= 1
        }
    }

    private func configureErrorView() {
        errorView.translatesAutoresizingMaskIntoConstraints = false
        errorView.backgroundColor = UIColor(red: 0.90, green: 0.99, blue: 0.97, alpha: 1)
        errorView.isHidden = true

        let title = UILabel()
        title.text = "Teach Today could not load"
        title.font = .systemFont(ofSize: 28, weight: .bold)
        title.textAlignment = .center

        errorLabel.font = .systemFont(ofSize: 17, weight: .medium)
        errorLabel.textColor = .secondaryLabel
        errorLabel.textAlignment = .center
        errorLabel.numberOfLines = 0

        let retry = UIButton(type: .system)
        retry.configuration = .filled()
        retry.configuration?.title = "Try Again"
        retry.addTarget(self, action: #selector(retryLoading), for: .touchUpInside)

        let stack = UIStackView(arrangedSubviews: [title, errorLabel, retry])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.alignment = .center
        stack.spacing = 18
        errorView.addSubview(stack)
        view.addSubview(errorView)

        NSLayoutConstraint.activate([
            errorView.topAnchor.constraint(equalTo: view.topAnchor),
            errorView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            errorView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            errorView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            stack.centerXAnchor.constraint(equalTo: errorView.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: errorView.centerYAnchor),
            stack.widthAnchor.constraint(lessThanOrEqualTo: errorView.widthAnchor, multiplier: 0.8)
        ])
    }

    private func loadTeachToday() {
        errorView.isHidden = true
        webView.load(URLRequest(url: TeachTodayWeb.teacherURL, cachePolicy: .reloadRevalidatingCacheData))
    }

    @objc private func retryLoading() {
        loadTeachToday()
    }

    func secureProjectionForBackground() {
        setExternalProjectionMode(.stage, notifyWeb: true)
    }

    private func showLoadError(_ error: Error) {
        errorLabel.text = error.localizedDescription
        errorView.isHidden = false
    }

    private func setExternalProjectionMode(_ mode: ExternalProjectionMode, notifyWeb: Bool = false) {
        mirrorTimer?.invalidate()
        mirrorTimer = nil
        snapshotInFlight = false
        StageCoordinator.shared.setProjectionMode(mode)

        if mode == .mirror {
            captureTeacherSnapshot()
            let timer = Timer(timeInterval: 0.16, repeats: true) { [weak self] _ in
                self?.captureTeacherSnapshot()
            }
            mirrorTimer = timer
            RunLoop.main.add(timer, forMode: .common)
        }

        if notifyWeb {
            let value = mode == .mirror ? "mirror" : "stage"
            webView.evaluateJavaScript(
                "window.dispatchEvent(new CustomEvent('teachTodayNativeProjectionMode', { detail: { mode: '\(value)' } }));"
            )
        }
    }

    private func captureTeacherSnapshot() {
        guard StageCoordinator.shared.projectionMode == .mirror,
              !snapshotInFlight,
              webView.window != nil,
              !webView.bounds.isEmpty
        else { return }

        snapshotInFlight = true
        let configuration = WKSnapshotConfiguration()
        configuration.rect = webView.bounds
        configuration.snapshotWidth = NSNumber(value: min(1_400, max(900, webView.bounds.width)))
        webView.takeSnapshot(with: configuration) { [weak self] image, _ in
            guard let self else { return }
            snapshotInFlight = false
            guard StageCoordinator.shared.projectionMode == .mirror,
                  let image = image?.cgImage
            else { return }
            StageCoordinator.shared.displayTeacherSnapshot(image)
        }
    }

    private func saveBackup(_ command: [String: Any]) {
        let requestId = command["requestId"] as? String ?? ""
        backupQueue.async { [weak self] in
            self?.performBackup(command, requestId: requestId)
        }
    }

    private func performBackup(_ command: [String: Any], requestId: String) {
        do {
            guard !requestId.isEmpty,
                  let content = command["content"] as? String,
                  let expectedHash = command["sha256"] as? String,
                  let dailyName = command["dailyName"] as? String,
                  let weeklyName = command["weeklyName"] as? String,
                  let data = content.data(using: .utf8),
                  !data.isEmpty,
                  data.count <= 30_000_000
            else { throw BackupError.invalidRequest }

            guard Self.isAllowedBackupName(dailyName, prefix: "teach-today-daily-"),
                  Self.isAllowedBackupName(weeklyName, prefix: "teach-today-weekly-")
            else { throw BackupError.invalidFileName }

            let object = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            guard object?["kind"] as? String == "TeachTodayBackup",
                  let appState = object?["appState"] as? [String: Any],
                  appState["groups"] is [Any]
            else { throw BackupError.invalidPayload }

            let digest = SHA256.hash(data: data).map { String(format: "%02x", $0) }.joined()
            guard digest == expectedHash.lowercased() else { throw BackupError.hashMismatch }

            let documents = try FileManager.default.url(
                for: .documentDirectory,
                in: .userDomainMask,
                appropriateFor: nil,
                create: true
            )
            let backupRoot = documents.appendingPathComponent("Backups", isDirectory: true)
            let dailyFolder = backupRoot.appendingPathComponent("Daily", isDirectory: true)
            let weeklyFolder = backupRoot.appendingPathComponent("Weekly", isDirectory: true)
            try FileManager.default.createDirectory(at: dailyFolder, withIntermediateDirectories: true)
            try FileManager.default.createDirectory(at: weeklyFolder, withIntermediateDirectories: true)
            let dailyURL = dailyFolder.appendingPathComponent(dailyName)
            let weeklyURL = weeklyFolder.appendingPathComponent(weeklyName)
            try data.write(to: dailyURL, options: .atomic)
            try data.write(to: weeklyURL, options: .atomic)
            guard try Data(contentsOf: dailyURL) == data,
                  try Data(contentsOf: weeklyURL) == data
            else { throw BackupError.verificationFailed }

            dispatchBackupResult([
                "requestId": requestId,
                "ok": true,
                "bytes": data.count,
                "dailyPath": "Backups/Daily/\(dailyName)",
                "weeklyPath": "Backups/Weekly/\(weeklyName)"
            ])
        } catch {
            dispatchBackupResult([
                "requestId": requestId,
                "ok": false,
                "error": error.localizedDescription
            ])
        }
    }

    private static func isAllowedBackupName(_ name: String, prefix: String) -> Bool {
        guard name.hasPrefix(prefix), name.hasSuffix(".json"), name.count == prefix.count + 10 + 5 else { return false }
        let datePart = name.dropFirst(prefix.count).dropLast(5)
        return datePart.enumerated().allSatisfy { index, character in
            (index == 4 || index == 7) ? character == "-" : character.isNumber
        }
    }

    private func dispatchBackupResult(_ detail: [String: Any]) {
        guard JSONSerialization.isValidJSONObject(detail),
              let data = try? JSONSerialization.data(withJSONObject: detail),
              let json = String(data: data, encoding: .utf8)
        else { return }
        DispatchQueue.main.async { [weak self] in
            self?.webView.evaluateJavaScript(
                "window.dispatchEvent(new CustomEvent('teachTodayNativeBackupResult', {detail: \(json)}));"
            )
        }
    }
}

private enum BackupError: LocalizedError {
    case invalidRequest, invalidFileName, invalidPayload, hashMismatch, verificationFailed

    var errorDescription: String? {
        switch self {
        case .invalidRequest: return "The backup request was incomplete."
        case .invalidFileName: return "The backup file name was not allowed."
        case .invalidPayload: return "The backup did not contain valid Teach Today data."
        case .hashMismatch: return "The backup changed before it reached Files."
        case .verificationFailed: return "The saved Files backup could not be verified."
        }
    }
}

extension TeacherWebViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        errorView.isHidden = true
        progressView.isHidden = true
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        if (error as NSError).code == NSURLErrorCancelled { return }
        showLoadError(error)
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if (error as NSError).code == NSURLErrorCancelled { return }
        showLoadError(error)
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        setExternalProjectionMode(.stage, notifyWeb: true)
        loadTeachToday()
    }
}

extension TeacherWebViewController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.frameInfo.isMainFrame,
              TeachTodayWeb.isTrustedAppURL(message.frameInfo.request.url)
        else { return }

        if message.name == messageName {
            StageCoordinator.shared.receive(message.body)
            return
        }

        if message.name == projectionMessageName,
           let command = message.body as? [String: Any],
           let mode = command["mode"] as? String {
            setExternalProjectionMode(mode == "mirror" ? .mirror : .stage)
            return
        }

        if message.name == backupMessageName,
           let command = message.body as? [String: Any] {
            saveBackup(command)
        }
    }
}

extension TeacherWebViewController: WKUIDelegate {
    func webView(
        _ webView: WKWebView,
        runJavaScriptConfirmPanelWithMessage message: String,
        initiatedByFrame frame: WKFrameInfo,
        completionHandler: @escaping (Bool) -> Void
    ) {
        guard frame.isMainFrame,
              TeachTodayWeb.isTrustedAppURL(frame.request.url),
              viewIfLoaded?.window != nil,
              presentedViewController == nil
        else {
            completionHandler(false)
            return
        }

        let alert = UIAlertController(title: "Confirm", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "Cancel", style: .cancel) { _ in
            completionHandler(false)
        })
        alert.addAction(UIAlertAction(title: "Continue", style: .default) { _ in
            completionHandler(true)
        })
        present(alert, animated: true)
    }

    func webView(
        _ webView: WKWebView,
        createWebViewWith configuration: WKWebViewConfiguration,
        for navigationAction: WKNavigationAction,
        windowFeatures: WKWindowFeatures
    ) -> WKWebView? {
        guard navigationAction.targetFrame == nil,
              let url = navigationAction.request.url
        else { return nil }

        if url.lastPathComponent == "StudentDisplay.html" {
            return nil
        }

        let popup = PopupWebViewController(configuration: configuration)
        let navigation = UINavigationController(rootViewController: popup)
        navigation.modalPresentationStyle = .fullScreen
        popup.onClose = { [weak self] in self?.popupController = nil }
        popupController = popup
        present(navigation, animated: true)
        return popup.webView
    }
}
