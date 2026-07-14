import Cocoa
import WebKit

final class StatusBarController: NSObject, WKNavigationDelegate {
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

        button.image = onigiriIcon()
        button.action = #selector(handleClick)
        button.target = self
        button.sendAction(on: [.leftMouseUp, .rightMouseUp])
        button.toolTip = "KeizoKode"
    }

    private func setupPopover() {
        let config = WKWebViewConfiguration()
        config.applicationNameForUserAgent = "KeizoKode"
        // Disable auto-play and other noisy features
        config.defaultWebpagePreferences.allowsContentJavaScript = true

        webView = WKWebView(frame: NSRect(x: 0, y: 0, width: popoverWidth, height: popoverHeight), configuration: config)
        webView.navigationDelegate = self

        popover = NSPopover()
        popover.contentSize = NSSize(width: popoverWidth, height: popoverHeight)
        popover.behavior = .transient
        popover.contentViewController = NSViewController()

        webView.frame = NSRect(x: 0, y: 0, width: popoverWidth, height: popoverHeight)
        webView.autoresizingMask = [.width, .height]

        popover.contentViewController?.view = webView
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
            reload()
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
            title: "Quit KeizoKode",
            action: #selector(NSApplication.terminate(_:)),
            keyEquivalent: "q"
        ))
        statusItem.menu = menu
        statusItem.button?.performClick(nil)
        statusItem.menu = nil
    }

    @objc private func reload() {
        guard let url = URL(string: "http://localhost:3000/menu-bar") else { return }
        webView.load(URLRequest(url: url))
    }

    private func onigiriIcon() -> NSImage {
        let size = NSSize(width: 18, height: 18)
        let image = NSImage(size: size)

        image.lockFocus()
        defer { image.unlockFocus() }

        guard let ctx = NSGraphicsContext.current?.cgContext else { return image }

        // Scale from SVG viewBox (100x100, y-down) to icon (18x18, y-up)
        let s: CGFloat = 18 / 100
        ctx.translateBy(x: 0, y: 18)
        ctx.scaleBy(x: s, y: -s)

        // Shadow
        ctx.setFillColor(CGColor(red: 0, green: 0, blue: 0, alpha: 0.06))
        ctx.fillEllipse(in: CGRect(x: 22, y: 87, width: 56, height: 8))

        // Rice body
        let body = CGMutablePath()
        body.move(to: CGPoint(x: 50, y: 8))
        body.addCurve(to: CGPoint(x: 68, y: 30), control1: CGPoint(x: 56, y: 8), control2: CGPoint(x: 62, y: 18))
        body.addLine(to: CGPoint(x: 84, y: 72))
        body.addCurve(to: CGPoint(x: 74, y: 88), control1: CGPoint(x: 88, y: 80), control2: CGPoint(x: 82, y: 88))
        body.addLine(to: CGPoint(x: 26, y: 88))
        body.addCurve(to: CGPoint(x: 16, y: 72), control1: CGPoint(x: 18, y: 88), control2: CGPoint(x: 12, y: 80))
        body.addLine(to: CGPoint(x: 32, y: 30))
        body.addCurve(to: CGPoint(x: 50, y: 8), control1: CGPoint(x: 38, y: 18), control2: CGPoint(x: 44, y: 8))
        body.closeSubpath()
        ctx.setFillColor(CGColor(red: 1, green: 0.96, blue: 0.90, alpha: 1)) // #FFF5E6
        ctx.addPath(body)
        ctx.fillPath()

        // Body outline
        ctx.setStrokeColor(CGColor(red: 0.91, green: 0.84, blue: 0.77, alpha: 1))
        ctx.setLineWidth(1.5)
        ctx.addPath(body)
        ctx.strokePath()

        // Body highlight
        ctx.setStrokeColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.5))
        ctx.setLineWidth(3)
        ctx.setLineCap(.round)
        let hl = CGMutablePath()
        hl.move(to: CGPoint(x: 46, y: 14))
        hl.addCurve(to: CGPoint(x: 58, y: 20), control1: CGPoint(x: 50, y: 12), control2: CGPoint(x: 55, y: 14))
        ctx.addPath(hl)
        ctx.strokePath()

        // Nori wrap
        let nori = CGMutablePath()
        nori.move(to: CGPoint(x: 16, y: 62))
        nori.addLine(to: CGPoint(x: 84, y: 62))
        nori.addCurve(to: CGPoint(x: 74, y: 88), control1: CGPoint(x: 86, y: 70), control2: CGPoint(x: 86, y: 78))
        nori.addLine(to: CGPoint(x: 26, y: 88))
        nori.addCurve(to: CGPoint(x: 16, y: 62), control1: CGPoint(x: 14, y: 78), control2: CGPoint(x: 14, y: 70))
        nori.closeSubpath()
        ctx.setFillColor(CGColor(red: 0.18, green: 0.29, blue: 0.24, alpha: 1)) // #2D4A3E
        ctx.addPath(nori)
        ctx.fillPath()

        // Nori edge detail
        ctx.setStrokeColor(CGColor(red: 0.23, green: 0.36, blue: 0.31, alpha: 0.6))
        ctx.setLineWidth(1.5)
        let noriEdge = CGMutablePath()
        noriEdge.move(to: CGPoint(x: 16, y: 62))
        noriEdge.addCurve(to: CGPoint(x: 40, y: 63), control1: CGPoint(x: 22, y: 58), control2: CGPoint(x: 32, y: 62))
        noriEdge.addCurve(to: CGPoint(x: 60, y: 63), control1: CGPoint(x: 48, y: 64), control2: CGPoint(x: 52, y: 61))
        noriEdge.addCurve(to: CGPoint(x: 84, y: 62), control1: CGPoint(x: 68, y: 65), control2: CGPoint(x: 78, y: 60))
        ctx.addPath(noriEdge)
        ctx.strokePath()

        // Happy eyes
        ctx.setStrokeColor(CGColor(red: 0.1, green: 0.1, blue: 0.1, alpha: 1))
        ctx.setLineWidth(2.5)
        ctx.setLineCap(.round)
        let eye1 = CGMutablePath()
        eye1.move(to: CGPoint(x: 33, y: 45))
        eye1.addQuadCurve(to: CGPoint(x: 39, y: 45), control: CGPoint(x: 36, y: 40))
        ctx.addPath(eye1)
        ctx.strokePath()
        let eye2 = CGMutablePath()
        eye2.move(to: CGPoint(x: 61, y: 45))
        eye2.addQuadCurve(to: CGPoint(x: 67, y: 45), control: CGPoint(x: 64, y: 40))
        ctx.addPath(eye2)
        ctx.strokePath()

        // Smile
        ctx.setLineWidth(2.5)
        let smile = CGMutablePath()
        smile.move(to: CGPoint(x: 42, y: 56))
        smile.addQuadCurve(to: CGPoint(x: 58, y: 56), control: CGPoint(x: 50, y: 64))
        ctx.addPath(smile)
        ctx.strokePath()

        // Blush
        ctx.setFillColor(CGColor(red: 0.95, green: 0.77, blue: 0.77, alpha: 0.7))
        ctx.fillEllipse(in: CGRect(x: 21, y: 48, width: 10, height: 6))
        ctx.fillEllipse(in: CGRect(x: 69, y: 48, width: 10, height: 6))

        return image
    }

    // MARK: - WKNavigationDelegate

    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        // Open link clicks in the default browser, keep initial load in the popover
        if navigationAction.navigationType == .linkActivated, let url = navigationAction.request.url {
            decisionHandler(.cancel)
            NSWorkspace.shared.open(url)
        } else {
            decisionHandler(.allow)
        }
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
          <p>KeizoKode</p>
          <p class="small">Start the dev server on port 3000 to connect</p>
        </div></body></html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }
}
