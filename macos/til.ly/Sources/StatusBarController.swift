import Cocoa
import WebKit

final class StatusBarController: NSObject, WKNavigationDelegate, WKUIDelegate {
    private var statusItem: NSStatusItem!
    private var popover: NSPopover!
    private var webView: WKWebView!
    private let popoverWidth: CGFloat = 520
    private let popoverHeight: CGFloat = 660

    override init() {
        super.init()
        setupStatusItem()
        setupPopover()
    }

    private func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        guard let button = statusItem.button else { return }

        button.image = mascotIcon()
        button.action = #selector(handleClick)
        button.target = self
        button.sendAction(on: [.leftMouseUp, .rightMouseUp])
        button.toolTip = "til.ly"
    }

    private func setupPopover() {
        let config = WKWebViewConfiguration()
        config.applicationNameForUserAgent = "til.ly"
        // Disable auto-play and other noisy features
        config.defaultWebpagePreferences.allowsContentJavaScript = true

        webView = WKWebView(frame: NSRect(x: 0, y: 0, width: popoverWidth, height: popoverHeight), configuration: config)
        webView.navigationDelegate = self
        webView.uiDelegate = self

        popover = NSPopover()
        popover.contentSize = NSSize(width: popoverWidth, height: popoverHeight)
        popover.behavior = .applicationDefined
        popover.contentViewController = NSViewController()

        webView.frame = NSRect(x: 0, y: 0, width: popoverWidth, height: popoverHeight)
        webView.autoresizingMask = [.width, .height]

        popover.contentViewController?.view = webView

        loadURL()
    }

    @objc private func handleClick() {
        guard let event = NSApp.currentEvent else { return }

        if event.type == .rightMouseUp {
            showMenu()
            return
        }

        togglePopover()
    }

    private func togglePopover() {
        guard let button = statusItem.button else { return }

        if popover.isShown {
            popover.performClose(nil)
        } else {
            popover.show(relativeTo: button.bounds, of: button, preferredEdge: .minY)
            popover.contentViewController?.view.window?.makeKey()
            // Ensure web view gets focus
            webView.window?.makeFirstResponder(webView)
        }
    }

    private func showMenu() {
        let menu = NSMenu()
        menu.addItem(NSMenuItem(
            title: "Reload",
            action: #selector(reload),
            keyEquivalent: "r"
        ))
        menu.addItem(.separator())
        menu.addItem(NSMenuItem(
            title: "Quit til.ly",
            action: #selector(NSApplication.terminate(_:)),
            keyEquivalent: "q"
        ))
        statusItem.menu = menu
        statusItem.button?.performClick(nil)
        statusItem.menu = nil
    }

    @objc private func reload() {
        loadURL()
    }

    private func loadURL() {
        guard let url = URL(string: "https://til-ly.vercel.app/menu-bar") else { return }
        webView.load(URLRequest(url: url))
    }

    private func mascotIcon() -> NSImage {
        let size = NSSize(width: 18, height: 18)
        let image = NSImage(size: size)
        if let url = Bundle.module.url(forResource: "logo-brand", withExtension: "png"),
           let source = NSImage(contentsOf: url)
        {
            image.lockFocus()
            source.draw(in: NSRect(origin: .zero, size: size),
                        from: NSRect(origin: .zero, size: source.size),
                        operation: NSCompositingOperation.copy,
                        fraction: 1)
            image.unlockFocus()
        }
        return image
    }

    // MARK: - WKNavigationDelegate / WKUIDelegate

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        // Open link clicks in the default browser, keep initial load in the popover
        if navigationAction.navigationType == .linkActivated, let url = navigationAction.request.url {
            decisionHandler(.cancel)
            NSWorkspace.shared.open(url)
        } else {
            decisionHandler(.allow)
        }
    }

    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        // Handle target="_blank" links — open in system browser
        if let url = navigationAction.request.url {
            NSWorkspace.shared.open(url)
        }
        return nil
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        // Keep the page as-is on failure
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        // Show a friendly offline state instead of the system error page
        let html = """
        <html><head><meta charset="utf-8">
        <style>
          body { font-family: -apple-system, sans-serif; display: flex; align-items: center;
                 justify-content: center; height: 100vh; margin: 0; background: #faf8f5;
                 color: #5c4a3a; }
          div { text-align: center; }
          p { font-size: 14px; margin: 8px 0; }
          .small { font-size: 11px; color: #a09080; }
        </style></head><body>
        <div>
          <p>til.ly</p>
          <p class="small">Start the dev server on port 3000 to connect</p>
        </div></body></html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }
}
