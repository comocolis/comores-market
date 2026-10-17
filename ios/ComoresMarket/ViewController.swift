import UIKit
import WebKit
import SafariServices

class ViewController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler {

    private let siteURL = URL(string: "https://www.comores-market.com/")!
    private let trustedHosts = Set(["comores-market.com", "www.comores-market.com"])

    private var webView: WKWebView!
    private var activityIndicator: UIActivityIndicatorView!
    private var refreshControl: UIRefreshControl!

    override func viewDidLoad() {
        super.viewDidLoad()

        setupWebView()
        setupActivityIndicator()
        setupRefreshControl()

        loadMainPage()
    }

    // MARK: - Setup UI & WKWebView
    private func setupWebView() {
        let contentController = WKUserContentController()
        contentController.add(self, name: "MedianBridge")

        let config = WKWebViewConfiguration()
        config.userContentController = contentController
        config.allowsInlineMediaPlayback = true

        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.backgroundColor = .white
        webView.scrollView.backgroundColor = .white

        // Suffix User-Agent comme sur Android
        if let defaultAgent = webView.customUserAgent ?? WKWebView().customUserAgent {
            webView.customUserAgent = defaultAgent + " ComoresMarketApp/1.0 iOS"
        } else {
            webView.customUserAgent = "ComoresMarketApp/1.0 iOS"
        }

        view.addSubview(webView)
    }

    private func setupActivityIndicator() {
        activityIndicator = UIActivityIndicatorView(style: .large)
        activityIndicator.center = view.center
        activityIndicator.hidesWhenStopped = true
        activityIndicator.color = UIColor(red: 22/255, green: 163/255, blue: 74/255, alpha: 1.0)
        view.addSubview(activityIndicator)
    }

    private func setupRefreshControl() {
        refreshControl = UIRefreshControl()
        refreshControl.addTarget(self, action: #selector(refreshPage), for: .valueChanged)
        webView.scrollView.addSubview(refreshControl)
    }

    @objc private func refreshPage() {
        webView.reload()
    }

    private func loadMainPage() {
        activityIndicator.startAnimating()
        let request = URLRequest(url: siteURL)
        webView.load(request)
    }

    // MARK: - WKNavigationDelegate (Gestion des URLs & Redirections)
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }

        let urlString = url.absoluteString

        // 1. Schéma personnalisé comoresmarket://
        if url.scheme == "comoresmarket" {
            let targetURLString: String
            if urlString.hasPrefix("comoresmarket://auth-callback") {
                targetURLString = urlString.replacingOccurrences(of: "comoresmarket://auth-callback", with: "https://www.comores-market.com/auth/callback")
            } else {
                targetURLString = urlString.replacingOccurrences(of: "comoresmarket://", with: "https://www.comores-market.com/")
            }
            if let targetURL = URL(string: targetURLString) {
                webView.load(URLRequest(url: targetURL))
            }
            decisionHandler(.cancel)
            return
        }

        // 2. Auth externe (Google OAuth, Supabase Auth) via SafariViewController
        if urlString.contains("accounts.google.com") ||
           urlString.contains("google.com/o/oauth2") ||
           urlString.contains("supabase.co/auth/v1/authorize") ||
           urlString.contains("auth/v1/authorize") {
            openSafariViewController(url: url)
            decisionHandler(.cancel)
            return
        }

        // 3. Intégration WhatsApp, Mail, Téléphone
        if urlString.hasPrefix("whatsapp:") || urlString.contains("api.whatsapp.com") || urlString.contains("wa.me") {
            if UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url)
            } else {
                showToast(message: "WhatsApp n'est pas installé sur cet appareil")
            }
            decisionHandler(.cancel)
            return
        }

        if url.scheme == "mailto" || url.scheme == "tel" {
            if UIApplication.shared.canOpenURL(url) {
                UIApplication.shared.open(url)
            }
            decisionHandler(.cancel)
            return
        }

        // 4. Domaines externes hors trustedHosts -> SFSafariViewController
        if let host = url.host, !trustedHosts.contains(host) && (url.scheme == "http" || url.scheme == "https") {
            openSafariViewController(url: url)
            decisionHandler(.cancel)
            return
        }

        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
        activityIndicator.startAnimating()
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        activityIndicator.stopAnimating()
        refreshControl.endRefreshing()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        activityIndicator.stopAnimating()
        refreshControl.endRefreshing()
    }

    // MARK: - JavaScript Bridge (MedianBridge)
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == "MedianBridge", let body = message.body as? [String: Any] else { return }

        if let action = body["action"] as? String {
            switch action {
            case "showToast":
                if let msg = body["message"] as? String {
                    showToast(message: msg)
                }
            case "shareText":
                if let title = body["title"] as? String, let urlString = body["url"] as? String {
                    shareText(title: title, urlString: urlString)
                }
            default:
                break
            }
        }
    }

    // MARK: - Helper Methods
    private func openSafariViewController(url: URL) {
        let safariVC = SFSafariViewController(url: url)
        safariVC.modalPresentationStyle = .pageSheet
        present(safariVC, animated: true)
    }

    private func showToast(message: String) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        present(alert, animated: true)
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.8) {
            alert.dismiss(animated: true)
        }
    }

    private func shareText(title: String, urlString: String) {
        guard let url = URL(string: urlString), let host = url.host, trustedHosts.contains(host) else { return }
        let items: [Any] = ["\(title)\n\(urlString)"]
        let activityVC = UIActivityViewController(activityItems: items, applicationActivities: nil)
        present(activityVC, animated: true)
    }
}
