
export function isTokenExpired(token) {
  if (!token) return true

  try {
    const payload = JSON.parse(atob(token.split('.')[1])) // decode JWT payload
    const expiry = payload.exp
    const now = Math.floor(Date.now() / 1000)

    return now > expiry
  } catch (err) {
    console.error("Invalid token", err)
    return true
  }
}
