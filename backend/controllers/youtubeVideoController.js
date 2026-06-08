import YoutubeVideoModel from '../models/youtubeVideoModel.js'

// ─── GET PUBLIC VIDEOS (active only, grouped by category) ─────────────────
// GET /api/youtube-videos/public
const getPublicVideos = async (req, res) => {
  try {
    const videos = await YoutubeVideoModel
      .find({ isActive: true })
      .sort({ category: 1, order: 1, createdAt: 1 })
      .select('videoId title category')
    res.json({ success: true, videos })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─── LIST ALL VIDEOS (admin) ──────────────────────────────────────────────
// GET /api/youtube-videos
const listVideos = async (req, res) => {
  try {
    const videos = await YoutubeVideoModel.find().sort({ category: 1, order: 1, createdAt: 1 })
    res.json({ success: true, videos })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─── CREATE ───────────────────────────────────────────────────────────────
// POST /api/youtube-videos
const createVideo = async (req, res) => {
  try {
    const { videoId, title, category, isActive } = req.body
    if (!videoId?.trim()) {
      return res.json({ success: false, message: 'YouTube video ID is required.' })
    }

    // Auto-assign order (last + 1)
    const last = await YoutubeVideoModel.findOne({ category: category || 'tutorials' })
      .sort({ order: -1 })
      .select('order')

    const video = await YoutubeVideoModel.create({
      videoId:   videoId.trim(),
      title:     title?.trim() || '',
      category:  category || 'tutorials',
      order:     (last?.order ?? -1) + 1,
      isActive:  isActive !== undefined ? Boolean(isActive) : true,
    })

    res.json({ success: true, video, message: 'Video added successfully.' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─── UPDATE ───────────────────────────────────────────────────────────────
// PUT /api/youtube-videos/:id
const updateVideo = async (req, res) => {
  try {
    const { id } = req.params
    const video = await YoutubeVideoModel.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    )
    if (!video) return res.json({ success: false, message: 'Video not found.' })
    res.json({ success: true, video, message: 'Video updated.' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────
// DELETE /api/youtube-videos/:id
const deleteVideo = async (req, res) => {
  try {
    const { id } = req.params
    const video = await YoutubeVideoModel.findByIdAndDelete(id)
    if (!video) return res.json({ success: false, message: 'Video not found.' })
    res.json({ success: true, message: 'Video deleted.' })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

// ─── TOGGLE ACTIVE ────────────────────────────────────────────────────────
// PATCH /api/youtube-videos/:id/toggle
const toggleVideo = async (req, res) => {
  try {
    const { id } = req.params
    const video = await YoutubeVideoModel.findById(id)
    if (!video) return res.json({ success: false, message: 'Video not found.' })
    video.isActive = !video.isActive
    await video.save()
    res.json({ success: true, isActive: video.isActive, message: `Video ${video.isActive ? 'activated' : 'deactivated'}.` })
  } catch (error) {
    console.log(error)
    res.json({ success: false, message: error.message })
  }
}

export { getPublicVideos, listVideos, createVideo, updateVideo, deleteVideo, toggleVideo }
