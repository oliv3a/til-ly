// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "KeizoKode",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "KeizoKode",
            path: "Sources"
        ),
    ]
)
