import footerSettingsModel from '../models/footerSettingsModel.js'

// ─── GET FOOTER SETTINGS ──────────────────────────────────────────────────────
// GET /api/footer
// Public — used by the frontend Footer component
const getFooterSettings = async (req, res) => {
  try {
    // findOne with no filter → gets the single settings doc
    // If none exists, create one with all defaults on the fly
    let settings = await footerSettingsModel.findOne()
    if (!settings) {
      settings = await footerSettingsModel.create({})
    }
    res.json({ success: true, settings })
  } catch (error) {
    console.log('getFooterSettings error:', error)
    res.json({ success: false, message: error.message })
  }
}

// ─── UPDATE FOOTER SETTINGS ───────────────────────────────────────────────────
// PUT /api/footer
// Admin only — full replace of editable fields
const updateFooterSettings = async (req, res) => {
  try {
    const {
      phones, email, address, hours,
      whatsapp, instagram, facebook, youtube, twitter,
      newsletterTitle, newsletterSubtitle,
      playStoreLink, appStoreLink,
      trustBadges, copyrightText,
    } = req.body

    // findOneAndUpdate with upsert — creates doc if it doesn't exist
    const updated = await footerSettingsModel.findOneAndUpdate(
      {},   // match any (singleton)
      {
        $set: {
          phones:             phones             ?? undefined,
          email:              email              ?? undefined,
          address:            address            ?? undefined,
          hours:              hours              ?? undefined,
          whatsapp:           whatsapp           ?? undefined,
          instagram:          instagram          ?? undefined,
          facebook:           facebook           ?? undefined,
          youtube:            youtube            ?? undefined,
          twitter:            twitter            ?? undefined,
          newsletterTitle:    newsletterTitle    ?? undefined,
          newsletterSubtitle: newsletterSubtitle ?? undefined,
          playStoreLink:      playStoreLink      ?? undefined,
          appStoreLink:       appStoreLink       ?? undefined,
          trustBadges:        trustBadges        ?? undefined,
          copyrightText:      copyrightText      ?? undefined,
        },
      },
      { new: true, upsert: true, runValidators: true }
    )

    res.json({ success: true, settings: updated, message: 'Footer updated successfully.' })
  } catch (error) {
    console.log('updateFooterSettings error:', error)
    res.json({ success: false, message: error.message })
  }
}

export { getFooterSettings, updateFooterSettings }
