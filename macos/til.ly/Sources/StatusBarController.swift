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
        guard let url = URL(string: "http://localhost:3000/menu-bar") else { return }
        webView.load(URLRequest(url: url))
    }

    private func mascotIcon() -> NSImage {
        let size = NSSize(width: 18, height: 18)
        let image = NSImage(size: size)

        image.lockFocus()
        defer { image.unlockFocus() }

        guard let ctx = NSGraphicsContext.current?.cgContext else { return image }

        // Scale from viewBox (100x100, y-down) to icon (18x18, y-up)
        let s: CGFloat = 18 / 100
        ctx.translateBy(x: 0, y: 18)
        ctx.scaleBy(x: s, y: -s)

        let bodyColor = CGColor(red: 0.72, green: 0.90, blue: 0.85, alpha: 1) // #B8E6D8
        let earColor = CGColor(red: 0.63, green: 0.85, blue: 0.78, alpha: 1)   // #A0D8C8
        let outlineColor = CGColor(red: 0.11, green: 0.11, blue: 0.11, alpha: 1) // #1C1C1C

        ctx.setStrokeColor(outlineColor)

        // Shadow
        ctx.setFillColor(CGColor(red: 0, green: 0, blue: 0, alpha: 0.06))
        ctx.fillEllipse(in: CGRect(x: 20, y: 89, width: 64, height: 6))

        // Tail
        ctx.setStrokeColor(outlineColor)
        ctx.setLineWidth(2.5)
        ctx.setLineCap(.round)
        let tail = CGMutablePath()
        tail.move(to: CGPoint(x: 80, y: 54))
        tail.addCurve(to: CGPoint(x: 92, y: 38), control1: CGPoint(x: 90, y: 50), control2: CGPoint(x: 94, y: 44))
        ctx.addPath(tail)
        ctx.strokePath()

        // Body
        ctx.setFillColor(bodyColor)
        ctx.setStrokeColor(outlineColor)
        ctx.setLineWidth(1.5)
        let body = CGMutablePath()
        body.move(to: CGPoint(x: 38, y: 44))
        body.addCurve(to: CGPoint(x: 82, y: 52), control1: CGPoint(x: 60, y: 40), control2: CGPoint(x: 78, y: 44))
        body.addCurve(to: CGPoint(x: 80, y: 76), control1: CGPoint(x: 86, y: 60), control2: CGPoint(x: 84, y: 72))
        body.addCurve(to: CGPoint(x: 38, y: 74), control1: CGPoint(x: 76, y: 80), control2: CGPoint(x: 44, y: 80))
        body.addCurve(to: CGPoint(x: 38, y: 44), control1: CGPoint(x: 32, y: 68), control2: CGPoint(x: 30, y: 50))
        body.closeSubpath()
        ctx.addPath(body)
        ctx.fillPath()
        ctx.addPath(body)
        ctx.strokePath()

        // Back legs
        ctx.setStrokeColor(outlineColor)
        ctx.setLineWidth(1.5)
        ctx.setLineCap(.round)
        let backLeg1 = CGMutablePath()
        backLeg1.move(to: CGPoint(x: 72, y: 74))
        backLeg1.addCurve(to: CGPoint(x: 72, y: 90), control1: CGPoint(x: 68, y: 88), control2: CGPoint(x: 68, y: 90))
        backLeg1.addCurve(to: CGPoint(x: 76, y: 90), control1: CGPoint(x: 76, y: 92), control2: CGPoint(x: 72, y: 92))
        backLeg1.addCurve(to: CGPoint(x: 76, y: 74), control1: CGPoint(x: 76, y: 88), control2: CGPoint(x: 76, y: 74))
        ctx.addPath(backLeg1)
        ctx.strokePath()

        let backLeg2 = CGMutablePath()
        backLeg2.move(to: CGPoint(x: 76, y: 74))
        backLeg2.addCurve(to: CGPoint(x: 74, y: 90), control1: CGPoint(x: 74, y: 88), control2: CGPoint(x: 74, y: 90))
        backLeg2.addCurve(to: CGPoint(x: 78, y: 90), control1: CGPoint(x: 78, y: 92), control2: CGPoint(x: 74, y: 92))
        backLeg2.addCurve(to: CGPoint(x: 80, y: 74), control1: CGPoint(x: 78, y: 88), control2: CGPoint(x: 80, y: 74))
        ctx.addPath(backLeg2)
        ctx.strokePath()

        // Front legs
        let frontLeg1 = CGMutablePath()
        frontLeg1.move(to: CGPoint(x: 40, y: 74))
        frontLeg1.addCurve(to: CGPoint(x: 36, y: 90), control1: CGPoint(x: 36, y: 88), control2: CGPoint(x: 36, y: 90))
        frontLeg1.addCurve(to: CGPoint(x: 40, y: 90), control1: CGPoint(x: 40, y: 92), control2: CGPoint(x: 36, y: 92))
        frontLeg1.addCurve(to: CGPoint(x: 44, y: 74), control1: CGPoint(x: 40, y: 88), control2: CGPoint(x: 44, y: 74))
        ctx.addPath(frontLeg1)
        ctx.strokePath()

        let frontLeg2 = CGMutablePath()
        frontLeg2.move(to: CGPoint(x: 44, y: 74))
        frontLeg2.addCurve(to: CGPoint(x: 40, y: 90), control1: CGPoint(x: 40, y: 88), control2: CGPoint(x: 40, y: 90))
        frontLeg2.addCurve(to: CGPoint(x: 44, y: 90), control1: CGPoint(x: 44, y: 92), control2: CGPoint(x: 40, y: 92))
        frontLeg2.addCurve(to: CGPoint(x: 48, y: 74), control1: CGPoint(x: 44, y: 88), control2: CGPoint(x: 48, y: 74))
        ctx.addPath(frontLeg2)
        ctx.strokePath()

        // Paws
        ctx.setFillColor(bodyColor)
        ctx.setStrokeColor(outlineColor)
        ctx.setLineWidth(1.2)
        ctx.fillEllipse(in: CGRect(x: 34, y: 88.5, width: 8, height: 5))
        ctx.strokeEllipse(in: CGRect(x: 34, y: 88.5, width: 8, height: 5))
        ctx.fillEllipse(in: CGRect(x: 42, y: 88.5, width: 8, height: 5))
        ctx.strokeEllipse(in: CGRect(x: 42, y: 88.5, width: 8, height: 5))
        ctx.fillEllipse(in: CGRect(x: 66, y: 88.5, width: 8, height: 5))
        ctx.strokeEllipse(in: CGRect(x: 66, y: 88.5, width: 8, height: 5))
        ctx.fillEllipse(in: CGRect(x: 74, y: 88.5, width: 8, height: 5))
        ctx.strokeEllipse(in: CGRect(x: 74, y: 88.5, width: 8, height: 5))

        // Ear
        ctx.setFillColor(earColor)
        ctx.setStrokeColor(outlineColor)
        ctx.setLineWidth(1.5)
        let ear = CGMutablePath()
        ear.move(to: CGPoint(x: 40, y: 22))
        ear.addCurve(to: CGPoint(x: 48, y: 48), control1: CGPoint(x: 48, y: 24), control2: CGPoint(x: 50, y: 38))
        ear.addCurve(to: CGPoint(x: 38, y: 48), control1: CGPoint(x: 46, y: 52), control2: CGPoint(x: 40, y: 52))
        ear.addCurve(to: CGPoint(x: 40, y: 22), control1: CGPoint(x: 36, y: 44), control2: CGPoint(x: 36, y: 30))
        ear.closeSubpath()
        ctx.addPath(ear)
        ctx.fillPath()
        ctx.addPath(ear)
        ctx.strokePath()

        // Head + snout
        ctx.setFillColor(bodyColor)
        ctx.setStrokeColor(outlineColor)
        ctx.setLineWidth(1.5)
        let head = CGMutablePath()
        head.move(to: CGPoint(x: 40, y: 22))
        head.addCurve(to: CGPoint(x: 14, y: 22), control1: CGPoint(x: 36, y: 12), control2: CGPoint(x: 18, y: 16))
        head.addCurve(to: CGPoint(x: 14, y: 34), control1: CGPoint(x: 12, y: 26), control2: CGPoint(x: 12, y: 32))
        head.addCurve(to: CGPoint(x: 26, y: 40), control1: CGPoint(x: 16, y: 36), control2: CGPoint(x: 20, y: 40))
        head.addCurve(to: CGPoint(x: 42, y: 34), control1: CGPoint(x: 32, y: 40), control2: CGPoint(x: 38, y: 38))
        head.addCurve(to: CGPoint(x: 40, y: 22), control1: CGPoint(x: 44, y: 30), control2: CGPoint(x: 44, y: 26))
        head.closeSubpath()
        ctx.addPath(head)
        ctx.fillPath()
        ctx.addPath(head)
        ctx.strokePath()

        // Nose
        ctx.setFillColor(outlineColor)
        ctx.fillEllipse(in: CGRect(x: 11.5, y: 24, width: 5, height: 4))

        // Eye
        ctx.setFillColor(outlineColor)
        ctx.fillEllipse(in: CGRect(x: 27.5, y: 27.5, width: 5, height: 5))

        // Collar
        ctx.setStrokeColor(CGColor(red: 0.48, green: 0.85, blue: 0.78, alpha: 1)) // #7AD8C8
        ctx.setLineWidth(3)
        ctx.setLineCap(.round)
        let collar = CGMutablePath()
        collar.move(to: CGPoint(x: 28, y: 42))
        collar.addLine(to: CGPoint(x: 44, y: 42))
        ctx.addPath(collar)
        ctx.strokePath()

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
