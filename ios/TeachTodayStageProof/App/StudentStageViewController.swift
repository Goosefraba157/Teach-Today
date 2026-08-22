import UIKit
import WebKit

final class StudentStageViewController: UIViewController, StagePayloadReceiver {
    private let webView: WKWebView
    private let fallbackView = UIView()
    private var stageIsReady = false
    private var pendingPayload: [String: Any]?
    private var retryWorkItem: DispatchWorkItem?

    init() {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .nonPersistent()
        configuration.allowsInlineMediaPlayback = true
        webView = WKWebView(frame: .zero, configuration: configuration)
        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor(red: 0.90, green: 0.99, blue: 0.97, alpha: 1)

        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        webView.isUserInteractionEnabled = false
        webView.scrollView.isScrollEnabled = false
        webView.scrollView.contentInsetAdjustmentBehavior = .never
#if DEBUG
        if #available(iOS 16.4, *) { webView.isInspectable = true }
#endif
        view.addSubview(webView)
        configureFallbackView()
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        StageCoordinator.shared.attach(self)
        webView.load(URLRequest(url: TeachTodayWeb.studentURL, cachePolicy: .reloadRevalidatingCacheData))
    }

    func reloadIfNeeded() {
        guard !stageIsReady else { return }
        loadStudentStage()
    }

    func displayStagePayload(_ payload: [String: Any]) {
        pendingPayload = payload
        guard stageIsReady else { return }
        sendPendingPayload()
    }

    private func sendPendingPayload() {
        guard let payload = pendingPayload else { return }
        pendingPayload = nil
        Task { @MainActor [weak self] in
            guard let self else { return }
            do {
                _ = try await webView.callAsyncJavaScript(
                    "window.postMessage({ type: 'teachTodayStudentDisplay', payload }, window.location.origin);",
                    arguments: ["payload": payload],
                    in: nil,
                    contentWorld: .page
                )
            } catch {
                pendingPayload = payload
            }
        }
    }

    private func configureFallbackView() {
        fallbackView.translatesAutoresizingMaskIntoConstraints = false
        fallbackView.backgroundColor = UIColor(red: 0.90, green: 0.99, blue: 0.97, alpha: 1)

        let title = UILabel()
        title.text = "Classroom Stage"
        title.font = .systemFont(ofSize: 48, weight: .black)
        title.textColor = UIColor(red: 0.04, green: 0.28, blue: 0.28, alpha: 1)
        title.textAlignment = .center

        let detail = UILabel()
        detail.text = "Reconnecting..."
        detail.font = .systemFont(ofSize: 24, weight: .semibold)
        detail.textColor = UIColor(red: 0.18, green: 0.36, blue: 0.38, alpha: 1)
        detail.textAlignment = .center

        let stack = UIStackView(arrangedSubviews: [title, detail])
        stack.translatesAutoresizingMaskIntoConstraints = false
        stack.axis = .vertical
        stack.spacing = 18
        fallbackView.addSubview(stack)
        view.addSubview(fallbackView)
        NSLayoutConstraint.activate([
            fallbackView.topAnchor.constraint(equalTo: view.topAnchor),
            fallbackView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            fallbackView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            fallbackView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            stack.centerXAnchor.constraint(equalTo: fallbackView.centerXAnchor),
            stack.centerYAnchor.constraint(equalTo: fallbackView.centerYAnchor),
            stack.widthAnchor.constraint(lessThanOrEqualTo: fallbackView.widthAnchor, multiplier: 0.85)
        ])
    }

    private func loadStudentStage() {
        retryWorkItem?.cancel()
        fallbackView.isHidden = false
        stageIsReady = false
        webView.load(URLRequest(url: TeachTodayWeb.studentURL, cachePolicy: .reloadRevalidatingCacheData))
    }

    private func scheduleRetry() {
        retryWorkItem?.cancel()
        let workItem = DispatchWorkItem { [weak self] in
            self?.loadStudentStage()
        }
        retryWorkItem = workItem
        DispatchQueue.main.asyncAfter(deadline: .now() + 3, execute: workItem)
    }
}

extension StudentStageViewController: WKNavigationDelegate {
    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        stageIsReady = false
        fallbackView.isHidden = false
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        retryWorkItem?.cancel()
        stageIsReady = true
        fallbackView.isHidden = true
        pendingPayload = StageCoordinator.shared.latestPayload
        sendPendingPayload()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        stageIsReady = false
        fallbackView.isHidden = false
        scheduleRetry()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        stageIsReady = false
        fallbackView.isHidden = false
        scheduleRetry()
    }

    func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
        loadStudentStage()
    }
}
