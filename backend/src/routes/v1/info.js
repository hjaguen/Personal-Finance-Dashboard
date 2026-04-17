// API Version Router - v1
// Follows semantic versioning: MAJOR.MINOR.PATCH
// - MAJOR: Breaking changes
// - MINOR: New features (backwards compatible)
// - PATCH: Bug fixes

import express from 'express';

const router = express.Router();

// Current version info
router.get('/info', (req, res) => {
  res.json({
    version: '1.0.0',
    major: 1,
    minor: 0,
    patch: 0,
    status: 'stable',
    description: 'Initial release with authentication, transactions, categories, summary, and budget alerts'
  });
});

export default router;

// Version history:
// 1.0.0 - Initial release (2026-04-17)
//   - Authentication (JWT)
//   - CRUD for transactions
//   - CRUD for categories  
//   - Financial summary
//   - Budget alerts
//   - Multi-user support