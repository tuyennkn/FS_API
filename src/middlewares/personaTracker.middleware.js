// src/middlewares/personaTracker.middleware.js
import { updateUserPersona, buildInteractionContext } from '../services/AI/personaUpdater.service.js';

/**
 * Middleware to track user interactions and update persona
 * Usage: Add after authentication middleware and before sending response
 * 
 * @param {String} interactionType - Type of interaction ('search', 'compare', 'review', etc.)
 * @param {Function} contextBuilder - Function to build context from req/res: (req, res) => Object
 * 
 * Example:
 * router.post('/search', 
 *   authenticate, 
 *   searchHandler, 
 *   trackPersona('search', (req, res) => ({ 
 *     query: req.body.query, 
 *     results: res.locals.resultsCount 
 *   }))
 * );
 */
export const trackPersona = (interactionType, contextBuilder) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to track before sending response
    res.json = function (data) {
      // Only track if user is authenticated and request succeeded
      if (req.user?._id && data.success !== false) {
        const userId = req.user._id;
        const userPersona = req.user.persona || '';

        try {
          // Build context from request/response
          const contextData = contextBuilder ? contextBuilder(req, res, data) : {};
          const interactionContext = buildInteractionContext(interactionType, contextData);

          // Update persona in background (non-blocking)
          updateUserPersona(userId, userPersona, interactionContext, interactionType)
            .catch(err => console.error(`[PersonaTracker] Update failed for ${interactionType}:`, err.message));

        } catch (error) {
          console.error('[PersonaTracker] Error building context:', error);
        }
      }

      // Send original response
      return originalJson(data);
    };

    next();
  };
};

/**
 * Manual persona update helper (for use in controllers)
 * Use this when you need more control over when/how to update
 * 
 * @param {Object} req - Express request object
 * @param {String} interactionType - Type of interaction
 * @param {Object} contextData - Context data for this interaction
 */
export const updatePersonaManually = async (req, interactionType, contextData) => {
  const userId = req.user?._id;
  if (!userId) {
    return; // Skip if not authenticated
  }

  const userPersona = req.user.persona || '';
  const interactionContext = buildInteractionContext(interactionType, contextData);

  // Update in background
  updateUserPersona(userId, userPersona, interactionContext, interactionType)
    .catch(err => console.error(`[PersonaUpdate] Failed for ${interactionType}:`, err.message));
};

/**
 * Batch persona update for multiple interactions
 * Useful when user performs multiple actions in one request
 * 
 * @param {String} userId - User ID
 * @param {String} currentPersona - Current persona
 * @param {Array} interactions - Array of {type, context} objects
 */
export const updatePersonaBatch = async (userId, currentPersona, interactions) => {
  if (!userId || !interactions || interactions.length === 0) {
    return;
  }

  try {
    // Combine all interactions into one context
    const combinedContext = interactions
      .map(i => buildInteractionContext(i.type, i.context))
      .join(' | ');

    const batchType = `batch_${interactions.map(i => i.type).join('_')}`;

    // Update once with combined context
    await updateUserPersona(userId, currentPersona, combinedContext, batchType);

  } catch (error) {
    console.error('[PersonaBatch] Update failed:', error);
  }
};
