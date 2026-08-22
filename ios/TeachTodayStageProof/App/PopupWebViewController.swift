import UIKit
import WebKit

final class PopupWebViewController: UIViewController {
    let webView: WKWebView
    var onClose: (() -> Void)?

    init(configuration: WKWebViewConfiguration) {
        webView = WKWebView(frame: .zero, configuration: configuration)
        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        navigationItem.title = "Sign in"
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            barButtonSystemItem: .close,
            target: self,
            action: #selector(closePopup)
        )

        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        webView.uiDelegate = self
        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
    }

    @objc private func closePopup() {
        webView.stopLoading()
        dismissPopup()
    }

    private func dismissPopup() {
        dismiss(animated: true) { [weak self] in
            self?.onClose?()
        }
    }
}

extension PopupWebViewController: WKNavigationDelegate {}

extension PopupWebViewController: WKUIDelegate {
    func webViewDidClose(_ webView: WKWebView) {
        dismissPopup()
    }
}
