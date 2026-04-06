import Foundation

/// API 统一响应格式
struct ApiResponse<T: Codable>: Codable {
    let code: Int
    let message: String
    let data: T?

    var isSuccess: Bool {
        code == 200
    }
}

/// 分页响应
struct PagedResponse<T: Codable>: Codable {
    let items: [T]
    let total: Int
    let page: Int
    let pageSize: Int

    enum CodingKeys: String, CodingKey {
        case items
        case total
        case page
        case pageSize = "page_size"
    }
}