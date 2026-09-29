import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import {
  ComplaintCategory,
  SeverityLevel,
  LocationCoordinates,
} from '../../types';
import { LocationPicker } from '../../components/maps/LocationPicker';
import {
  Send,
  Upload,
  Image as ImageIcon,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from 'lucide-react';

const SAMPLE_PHOTO_PREVIEWS = [
  {
    name: 'Road Damage / Pothole',
    url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Dumpster Overflow',
    url: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Water Pipe Leakage',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1862f43?auto=format&fit=crop&w=800&q=80',
  },
  {
    name: 'Broken Streetlight',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80',
  },
];

export const ReportIssuePage: React.FC = () => {
  const navigate = useNavigate();
  const { submitComplaint, currentUser } = useApp();

  const [description, setDescription] = useState(
    'Large asphalt crater and trench forming near the main market entrance. Rainwater accumulates rapidly causing severe vehicle congestion and motorcycle skidding.'
  );
  const [category, setCategory] = useState<ComplaintCategory>('Pothole / Road');
  const [severity, setSeverity] = useState<SeverityLevel>('High');
  const [citizenName, setCitizenName] = useState(currentUser.name || 'Aditi Sharma');
  const [citizenPhone, setCitizenPhone] = useState(currentUser.phone || '+91 98260 12345');

  const [location, setLocation] = useState<LocationCoordinates>({
    latitude: 23.2332,
    longitude: 77.4343,
    address: 'Near Chetak Bridge, MP Nagar Zone 1',
    landmark: 'Opposite Jyoti Cineplex',
    district: 'MP Nagar Commercial',
  });

  const [image, setImage] = useState<string>(
    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSampleImages, setShowSampleImages] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    description?: string;
    location?: string;
    image?: string;
    general?: string;
  }>({});

  const validateForm = (): boolean => {
    const errors: { description?: string; location?: string; image?: string } = {};

    if (!description.trim()) {
      errors.description = 'Please provide a detailed description of the municipal issue.';
    } else if (description.trim().length < 15) {
      errors.description = 'Description is too brief. Please enter at least 15 characters to assist AI classification.';
    } else if (description.length > 1200) {
      errors.description = 'Description exceeds the 1200 character limit.';
    }

    if (!location.address.trim()) {
      errors.location = 'A valid street address or location pin is required.';
    } else if (
      isNaN(location.latitude) ||
      location.latitude < -90 ||
      location.latitude > 90 ||
      isNaN(location.longitude) ||
      location.longitude < -180 ||
      location.longitude > 180
    ) {
      errors.location = 'Geographic coordinates are invalid. Please select a valid point on the map.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setFormErrors((prev) => ({ ...prev, general: undefined }));

    try {
      const sanitizedName = citizenName.trim().slice(0, 80) || 'Anonymous Citizen';
      const sanitizedPhone = citizenPhone.trim().slice(0, 30);

      const newComplaint = await submitComplaint({
        description: description.trim(),
        category,
        severity,
        location,
        image: image || undefined,
        citizenName: sanitizedName,
        citizenPhone: sanitizedPhone || undefined,
      });

      setIsSubmitting(false);
      navigate(`/confirmation/${newComplaint.id}`);
    } catch (err: any) {
      setIsSubmitting(false);
      setFormErrors((prev) => ({
        ...prev,
        general: err?.message || 'Failed to submit complaint to municipal intake server. Please try again.',
      }));
    }
  };

  const handleCustomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security: Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      setFormErrors((prev) => ({
        ...prev,
        image: 'Only standard images (JPG, PNG, WebP) are supported.',
      }));
      return;
    }

    // Security: Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setFormErrors((prev) => ({
        ...prev,
        image: 'Image exceeds maximum 5MB size limit. Please upload a smaller file.',
      }));
      return;
    }

    setFormErrors((prev) => ({ ...prev, image: undefined }));
    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12">
      {/* Page Title */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          <span>CIVIC DISPATCH INTAKE</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Report a Municipal Issue
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
          Provide issue details and pin the location on the map. Our AI decision-support system will automatically classify and prioritize your submission for city administrators.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 sm:p-6 space-y-5">
            {/* Category selection */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                Issue Category <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {[
                  'Pothole / Road',
                  'Garbage / Waste',
                  'Water Leakage',
                  'Streetlight',
                  'Traffic',
                  'Infrastructure',
                  'Other',
                ].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat as ComplaintCategory)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all cursor-pointer ${
                      category === cat
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs font-semibold'
                        : 'bg-slate-50/70 text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity level */}
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
                Reported Severity <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['Low', 'Medium', 'High'] as SeverityLevel[]).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverity(sev)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border text-center transition-all cursor-pointer ${
                      severity === sev
                        ? sev === 'High'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                          : sev === 'Medium'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                          : 'bg-slate-800 text-white border-slate-800 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {sev} Severity
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Select High for imminent safety hazards, electrical shocks, open shafts, or road obstruction.
              </p>
            </div>

            {/* Description textarea */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Issue Description <span className="text-rose-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400 font-mono">
                  {description.length} chars
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (formErrors.description) {
                    setFormErrors((prev) => ({ ...prev, description: undefined }));
                  }
                }}
                rows={4}
                required
                placeholder="Describe the issue in detail, including physical hazards, water pooling, traffic blockages, or odor..."
                className={`w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 border rounded-xl focus:outline-none focus:ring-2 placeholder:text-slate-400 transition-all leading-relaxed ${
                  formErrors.description
                    ? 'border-rose-400 focus:ring-rose-400/20 focus:border-rose-500'
                    : 'border-slate-200/90 focus:ring-slate-400/10 focus:border-slate-400'
                }`}
              />
              {formErrors.description && (
                <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {formErrors.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-400 font-mono">Sample quick fills:</span>
                <button
                  type="button"
                  onClick={() => {
                    setDescription('Large pothole near the main market entrance. Water collects here after rain causing vehicle damage.');
                    setCategory('Pothole / Road');
                    setSeverity('High');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  Market Pothole
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDescription('Garbage bin overflowing for 3 days near vegetable market. Severe smell and waste scattering on sidewalk.');
                    setCategory('Garbage / Waste');
                    setSeverity('High');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  Garbage Dump
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDescription('Pressurized water pipe leak bubbling up through asphalt. Clean potable water wasting continuously.');
                    setCategory('Water Leakage');
                    setSeverity('Medium');
                  }}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                >
                  Water Leak
                </button>
              </div>
            </div>

            {/* Location Picker (Map + Address) */}
            <div className="pt-3 border-t border-slate-100">
              <LocationPicker
                value={location}
                onChange={(newLoc) => {
                  setLocation(newLoc);
                  if (formErrors.location) {
                    setFormErrors((prev) => ({ ...prev, location: undefined }));
                  }
                }}
              />
              {formErrors.location && (
                <p className="text-[11px] text-rose-600 mt-2 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {formErrors.location}
                </p>
              )}
            </div>

            {/* Image upload (Optional) */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Photo Attachment (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setShowSampleImages(!showSampleImages)}
                  className="text-[11px] text-blue-600 hover:underline font-medium cursor-pointer"
                >
                  {showSampleImages ? 'Hide sample photos' : 'Choose sample photo'}
                </button>
              </div>

              {/* Sample Photo selector */}
              {showSampleImages && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                  {SAMPLE_PHOTO_PREVIEWS.map((sample) => (
                    <div
                      key={sample.name}
                      onClick={() => setImage(sample.url)}
                      className={`cursor-pointer rounded-lg overflow-hidden border transition-all ${
                        image === sample.url
                          ? 'border-slate-900 ring-2 ring-slate-900/10'
                          : 'border-slate-200 hover:opacity-80'
                      }`}
                    >
                      <img
                        src={sample.url}
                        alt={sample.name}
                        className="w-full h-16 object-cover"
                      />
                      <span className="text-[10px] block p-1 bg-white truncate font-medium text-slate-700">
                        {sample.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Current photo preview or upload dropzone */}
              {image ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200/80 h-36 bg-slate-100 flex items-center justify-center group shadow-2xs">
                  <img
                    src={image}
                    alt="Complaint preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 bg-white text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors">
                      Change Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCustomFileUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setImage('')}
                      className="p-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-slate-200 hover:border-slate-400 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-slate-50/40 hover:bg-slate-50/80 transition-colors">
                  <Upload className="w-5 h-5 text-slate-400 mb-1.5" />
                  <span className="text-xs font-semibold text-slate-700">
                    Click to upload photo or drag and drop
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                    PNG, JPG or WebP up to 5MB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCustomFileUpload}
                    className="hidden"
                  />
                </label>
              )}
              {formErrors.image && (
                <p className="text-[11px] text-rose-600 mt-2 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {formErrors.image}
                </p>
              )}
            </div>

            {/* Citizen Contact Info */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    Citizen Name (For Tracking)
                  </label>
                  <input
                    type="text"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 font-mono">
                    Phone / SMS Alert (Optional)
                  </label>
                  <input
                    type="text"
                    value={citizenPhone}
                    onChange={(e) => setCitizenPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white text-slate-900 border border-slate-200/90 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 transition-all"
                  />
                </div>
              </div>
              <p className="text-[10px] text-slate-400">
                🔒 <strong>Privacy Assurance:</strong> Citizen contact details are held confidential for municipal resolution tracking and SMS dispatches only. They are never published on public civic maps or exposed in API feeds.
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-3 space-y-2">
              {formErrors.general && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formErrors.general}</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !description.trim()}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all shadow-2xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Processing AI Classification & Registering...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Complaint & Generate Complaint ID</span>
                  </>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-400 mt-2 font-mono">
                A unique tracking reference (e.g. SC1024) will be generated immediately.
              </p>
            </div>
          </form>
        </div>
  );
};
