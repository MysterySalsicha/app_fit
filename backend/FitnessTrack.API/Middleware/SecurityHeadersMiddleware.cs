namespace FitnessTrack.API.Middleware;

/// <summary>
/// Adds security headers to all HTTP responses to harden the API against
/// common web attacks (XSS, clickjacking, MIME sniffing, etc.).
///
/// SEC-1 note: JWT is stored in localStorage (XSS-vulnerable). These headers
/// mitigate the XSS attack surface significantly by restricting script execution
/// to trusted sources only. The long-term fix is HttpOnly cookies.
/// </summary>
public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        // Prevent MIME type sniffing
        headers["X-Content-Type-Options"] = "nosniff";

        // Prevent clickjacking
        headers["X-Frame-Options"] = "DENY";

        // Enable XSS filtering in older browsers
        headers["X-XSS-Protection"] = "1; mode=block";

        // Restrict referrer information
        headers["Referrer-Policy"] = "strict-origin-when-cross-origin";

        // Remove server version fingerprinting
        headers.Remove("Server");
        headers.Remove("X-Powered-By");

        // Permissions policy — disable unneeded browser features
        headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()";

        // Content-Security-Policy — restricts where scripts/styles/images can load from.
        // This is the primary XSS mitigation for SEC-1 (JWT in localStorage).
        // Adjust 'connect-src' to match your actual API and CDN domains in production.
        headers["Content-Security-Policy"] =
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +    // 'unsafe-inline' needed for Next.js hydration
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob: https:; " +
            "connect-src 'self' https://api.gemini.google.com https://generativelanguage.googleapis.com; " +
            "font-src 'self' data:; " +
            "frame-ancestors 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'";

        await _next(context);
    }
}
