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

        let s: CGFloat = 18 / 100
        ctx.translateBy(x: 0, y: 18)
        ctx.scaleBy(x: s, y: -s)

        let bodyColor = CGColor(red: 0.72, green: 0.90, blue: 0.85, alpha: 1)
        let earColor = CGColor(red: 0.63, green: 0.85, blue: 0.78, alpha: 1)
        let outlineColor = CGColor(red: 0.11, green: 0.11, blue: 0.11, alpha: 1)
        let collarColor = CGColor(red: 0.48, green: 0.85, blue: 0.78, alpha: 1)
        let codeTagColor = CGColor(red: 0.29, green: 0.42, blue: 0.54, alpha: 1)
        let codeLineColor = CGColor(red: 0.50, green: 0.72, blue: 0.85, alpha: 1)
        let codeLineColor2 = CGColor(red: 0.91, green: 0.84, blue: 0.77, alpha: 1)

        // Shadow
        ctx.setFillColor(CGColor(red: 0, green: 0, blue: 0, alpha: 0.06))
        ctx.fillEllipse(in: CGRect(x: 16, y: 89, width: 68, height: 6))

        // Tail
        ctx.setStrokeColor(outlineColor)
        ctx.setLineWidth(2.5)
        ctx.setLineCap(.round)
        let tail = CGMutablePath()
        tail.move(to: CGPoint(x: 84, y: 56))
        tail.addQuadCurve(to: CGPoint(x: 94, y: 40), control: CGPoint(x: 94, y: 50))
        ctx.addPath(tail)
        ctx.strokePath()

        // Body
        ctx.setFillColor(bodyColor)
        ctx.setStrokeColor(outlineColor)
        ctx.setLineWidth(1.5)
        let body = CGMutablePath()
        body.move(to: CGPoint(x: 30, y: 48))
        body.addQuadCurve(to: CGPoint(x: 84, y: 48), control: CGPoint(x: 58, y: 44))
        body.addQuadCurve(to: CGPoint(x: 84, y: 68), control: CGPoint(x: 90, y: 52))
        body.addQuadCurve(to: CGPoint(x: 30, y: 68), control: CGPoint(x: 58, y: 72))
        body.addQuadCurve(to: CGPoint(x: 30, y: 48), control: CGPoint(x: 24, y: 64))
        body.closeSubpath()
        ctx.addPath(body)
        ctx.fillPath()
        ctx.addPath(body)
        ctx.strokePath()

        // Body highlight
        ctx.setStrokeColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.35))
        ctx.setLineWidth(2)
        ctx.setLineCap(.round)
        let hl = CGMutablePath()
        hl.move(to: CGPoint(x: 34, y: 54))
        hl.addQuadCurve(to: CGPoint(x: 80, y: 56), control: CGPoint(x: 58, y: 52))
        ctx.addPath(hl)
        ctx.strokePath()

        // Legs
        ctx.setStrokeColor(outlineColor)
        ctx.setLineWidth(1.2)
        let drawLeg: (CGFloat, CGFloat, CGFloat, CGFloat) -> Void = { x, y, w, h in
            let rect = CGRect(x: x, y: y, width: w, height: h)
            ctx.setFillColor(bodyColor)
            ctx.fill(rect)
            ctx.stroke(rect)
        }
        drawLeg(34, 68, 6, 16)
        drawLeg(42, 68, 6, 16)
        drawLeg(72, 68, 6, 16)
        drawLeg(80, 68, 6, 16)

        // Paws
        ctx.setFillColor(bodyColor)
        ctx.setStrokeColor(outlineColor)
        ctx.setLineWidth(1)
        let drawPaw: (CGFloat, CGFloat) -> Void = { cx, cy in
            let rect = CGRect(x: cx - 3.5, y: cy - 2, width: 7, height: 4)
            ctx.fillEllipse(in: rect)
            ctx.strokeEllipse(in: rect)
        }
        drawPaw(37, 86)
        drawPaw(45, 86)
        drawPaw(75, 86)
        drawPaw(83, 86)

        // Neck fill
        ctx.setFillColor(bodyColor)
        ctx.addRect(CGRect(x: 30, y: 42, width: 6, height: 6))
        ctx.fillPath()

        // Ear
        ctx.setFillColor(earColor)
        ctx.setStrokeColor(outlineColor)
        ctx.setLineWidth(1.5)
        let ear = CGMutablePath()
        ear.move(to: CGPoint(x: 30, y: 12))
        ear.addQuadCurve(to: CGPoint(x: 46, y: 38), control: CGPoint(x: 46, y: 16))
        ear.addQuadCurve(to: CGPoint(x: 36, y: 44), control: CGPoint(x: 46, y: 48))
        ear.addQuadCurve(to: CGPoint(x: 30, y: 12), control: CGPoint(x: 30, y: 34))
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
        head.move(to: CGPoint(x: 34, y: 42))
        head.addCurve(to: CGPoint(x: 6, y: 22), control1: CGPoint(x: 38, y: 26), control2: CGPoint(x: 34, y: 8))
        head.addCurve(to: CGPoint(x: 16, y: 34), control1: CGPoint(x: 6, y: 28), control2: CGPoint(x: 10, y: 32))
        head.addCurve(to: CGPoint(x: 34, y: 44), control1: CGPoint(x: 22, y: 36), control2: CGPoint(x: 28, y: 38))
        head.closeSubpath()
        ctx.addPath(head)
        ctx.fillPath()
        ctx.addPath(head)
        ctx.strokePath()

        // Nose
        ctx.setFillColor(outlineColor)
        ctx.fillEllipse(in: CGRect(x: 4.5, y: 22, width: 5, height: 4))

        // Eye
        ctx.setFillColor(outlineColor)
        ctx.fillEllipse(in: CGRect(x: 17.5, y: 19.5, width: 5, height: 5))

        // Glasses lens
        ctx.setStrokeColor(outlineColor)
        ctx.setLineWidth(1.2)
        ctx.strokeEllipse(in: CGRect(x: 14, y: 16, width: 12, height: 12))

        // Glasses arm
        ctx.setLineWidth(1.2)
        ctx.setLineCap(.round)
        let arm = CGMutablePath()
        arm.move(to: CGPoint(x: 26, y: 22))
        arm.addLine(to: CGPoint(x: 34, y: 19))
        ctx.addPath(arm)
        ctx.strokePath()

        // Collar
        ctx.setStrokeColor(collarColor)
        ctx.setLineWidth(3)
        ctx.setLineCap(.round)
        let collar = CGMutablePath()
        collar.move(to: CGPoint(x: 22, y: 40))
        collar.addLine(to: CGPoint(x: 36, y: 42))
        ctx.addPath(collar)
        ctx.strokePath()

        // Code-window tag
        ctx.setFillColor(codeTagColor)
        ctx.setStrokeColor(outlineColor)
        ctx.setLineWidth(1)
        let tagRect = CGRect(x: 24, y: 38, width: 10, height: 10)
        ctx.addPath(CGPath(roundedRect: tagRect, cornerWidth: 1.5, cornerHeight: 1.5, transform: nil))
        ctx.fillPath()
        ctx.addPath(CGPath(roundedRect: tagRect, cornerWidth: 1.5, cornerHeight: 1.5, transform: nil))
        ctx.strokePath()

        ctx.setStrokeColor(codeLineColor)
        ctx.setLineWidth(1.5)
        ctx.setLineCap(.round)
        let line1 = CGMutablePath()
        line1.move(to: CGPoint(x: 26, y: 41.5))
        line1.addLine(to: CGPoint(x: 32, y: 41.5))
        ctx.addPath(line1)
        ctx.strokePath()

        ctx.setStrokeColor(codeLineColor2)
        let line2 = CGMutablePath()
        line2.move(to: CGPoint(x: 26, y: 44.5))
        line2.addLine(to: CGPoint(x: 30, y: 44.5))
        ctx.addPath(line2)
        ctx.strokePath()

        // Smile
        ctx.setStrokeColor(outlineColor)
        ctx.setLineWidth(1.5)
        ctx.setLineCap(.round)
        let smile = CGMutablePath()
        smile.move(to: CGPoint(x: 10, y: 31))
        smile.addQuadCurve(to: CGPoint(x: 16, y: 31), control: CGPoint(x: 13, y: 33))
        ctx.addPath(smile)
        ctx.strokePath()

        // Blush
        ctx.setFillColor(CGColor(red: 0.95, green: 0.77, blue: 0.77, alpha: 0.5))
        ctx.fillEllipse(in: CGRect(x: 14, y: 25.5, width: 6, height: 3))

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
