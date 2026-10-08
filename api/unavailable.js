export default function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.status(503).json({
    error: 'Online accounts and the merchant workspace are awaiting database activation. You can still browse products and use your bag and wishlist. Payments are disabled.',
    code: 'BACKEND_NOT_ACTIVATED',
  });
}
