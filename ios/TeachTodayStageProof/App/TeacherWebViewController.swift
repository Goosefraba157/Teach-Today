import UIKit
import WebKit

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
    private let webView: WKWebView
    private let progressView = UIProgressView(progressViewStyle: .bar)
    private let errorView = UIView()
    private let errorLabel = UILabel()
    private var progressObservation: NSKeyValueObservation?
    private weak var popupController: PopupWebViewController?

    init() {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true
        configuration.userContentController.addUserScript(WKUserScript(
            source: "document.documentElement.dataset.teachTodayNative = 'ipad';",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        ))
        webView = WKWebView(frame: .zero, configuration: configuration)
        super.init(nibName: nil, bundle: nil)
        configuration.userContentController.add(WeakScriptMessageHandler(delegate: self), name: messageName)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    deinit {
        webView.configuration.userContentController.removeScriptMessageHandler(forName: messageName)
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

    private func showLoadError(_ error: Error) {
        errorLabel.text = error.localizedDescription
        errorView.isHidden = false
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
        loadTeachToday()
    }
}

extension TeacherWebViewController: WKScriptMessageHandler {
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == messageName,
              message.frameInfo.isMainFrame,
              TeachTodayWeb.isTrustedAppURL(message.frameInfo.request.url)
        else { return }
        StageCoordinator.shared.receive(message.body)
    }
}

extension TeacherWebViewController: WKUIDelegate {
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
