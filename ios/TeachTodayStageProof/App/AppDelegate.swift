import UIKit

@main
final class AppDelegate: UIResponder, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        configurationForConnecting connectingSceneSession: UISceneSession,
        options: UIScene.ConnectionOptions
    ) -> UISceneConfiguration {
        if connectingSceneSession.role == .windowExternalDisplayNonInteractive {
            let configuration = UISceneConfiguration(
                name: "External Display",
                sessionRole: connectingSceneSession.role
            )
            configuration.delegateClass = ExternalSceneDelegate.self
            return configuration
        }

        let configuration = UISceneConfiguration(
            name: "Main",
            sessionRole: connectingSceneSession.role
        )
        configuration.delegateClass = MainSceneDelegate.self
        return configuration
    }
}
