import Listing from "../models/Listing.js";

export async function uploadListingImages(req, res, next) {
  try {
    const listing = await Listing.findOne({ _id: req.params.id, hostId: req.user.sub });
    if (!listing) return res.status(404).json({ message: "Listing not found" });

    const urls = (req.files || []).map((f) => f.path); // Cloudinary URL
    if (urls.length === 0) return res.status(400).json({ message: "No images uploaded" });

    listing.images.push(...urls);
    await listing.save();

    res.json({ listing });
  } catch (e) {
    next(e);
  }
}