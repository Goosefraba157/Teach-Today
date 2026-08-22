import Foundation

enum TeachTodayWeb {
    static let origin = URL(string: "https://goosefraba157.github.io")!
    static let appPathPrefix = "/Teach-Today/"
    static let teacherURL = URL(string: "https://goosefraba157.github.io/Teach-Today/TeachToday.html?native=ipad")!
    static let studentURL = URL(string: "https://goosefraba157.github.io/Teach-Today/StudentDisplay.html?native=ipad")!

    static func isTrustedAppURL(_ url: URL?) -> Bool {
        guard let url else { return false }
        return url.scheme == origin.scheme
            && url.host == origin.host
            && url.path.hasPrefix(appPathPrefix)
    }
}
