import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import heic2any from 'heic2any';
import CollegeSelector from '../components/CollegeSelector';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { uploadImage } from '../lib/cloudinary';
import { checkSafety, categorizeListing } from '../lib/moderation';
import { compressImage } from '../lib/imageUtils';
import Input from '../components/Input';
import Button from '../components/Button';
import Toast from '../components/Toast';
import './CreateListingPage.css';

// Converts HEIC/HEIF files to JPEG. Returns the file as-is for other formats.
async function normalizeToJpeg(file) {
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' ||
        file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
    if (!isHeic) return file;
    try {
        const blob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 });
        return new File([blob], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' });
    } catch (e) {
        console.warn('HEIC conversion failed:', e);
        return file; // fall back to original
    }
}

const CreateListingPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        college: '',
        price: ''
    });
    const [photos, setPhotos] = useState([]);
    const [errors, setErrors] = useState({});
    const [previewUrls, setPreviewUrls] = useState([]);
    const [showToast, setShowToast] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState('');

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        if (name === 'price') {
            if (value !== '' && (!/^\d+$/.test(value) || parseInt(value) < 0)) {
                return;
            }
        }
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handlePhotoUpload = async (e) => {
        const rawFiles = Array.from(e.target.files);
        const newErrors = {};

        // Convert HEIC/HEIF to JPEG first, then process
        const files = await Promise.all(rawFiles.map(normalizeToJpeg));

        const validFiles = [];
        const newPreviews = [];

        for (const file of files) {
            const fileSizeMB = file.size / (1024 * 1024);
            if (fileSizeMB > 5) {
                newErrors.photos = `File "${file.name}" exceeds 5MB limit`;
            } else {
                validFiles.push(file);
                const reader = new FileReader();
                const dataUrl = await new Promise(res => {
                    reader.onloadend = () => res(reader.result);
                    reader.readAsDataURL(file);
                });
                newPreviews.push(dataUrl);
            }
        }

        const totalPhotos = photos.length + validFiles.length;
        if (!newErrors.photos) {
            if (totalPhotos >= 3) {
                newErrors.photos = '';
            } else {
                newErrors.photos = 'Please upload at least 3 photos';
            }
        }

        setPhotos(prev => [...prev, ...validFiles]);
        setPreviewUrls(prev => [...prev, ...newPreviews]);
        setErrors(prev => ({ ...prev, ...newErrors }));
    };

    const removePhoto = (index) => {
        const updatedPhotos = photos.filter((_, i) => i !== index);
        setPhotos(updatedPhotos);
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
        
        if (updatedPhotos.length < 3) {
            setErrors(prev => ({ ...prev, photos: 'Please upload at least 3 photos' }));
        } else {
            setErrors(prev => ({ ...prev, photos: '' }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.title.trim()) newErrors.title = 'Title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.college) newErrors.college = 'Please select a college';
        if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Please enter a valid price';
        if (photos.length < 3) newErrors.photos = 'Please upload at least 3 photos';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (validateForm()) {
            if (!user) {
                alert('You must be logged in to create a listing');
                return;
            }

            setIsSubmitting(true);
            setUploadProgress('Uploading images...');

            try {
                // 1. AI Content Moderation
                setUploadProgress('AI is analyzing your content...');

                // Check all images in parallel
                const analysisResults = await Promise.all(
                    photos.map(photo => checkSafety(photo, formData.title, formData.description))
                );

                const violation = analysisResults.find(result => !result.allowed);

                if (violation) {
                    throw new Error(`Content Policy Violation: ${violation.reason || 'This item cannot be sold on DormDrop.'}`);
                }

                // 2. Compress images before upload
                setUploadProgress('Optimizing images (reducing size by 50%+)...');
                const compressedPhotos = await Promise.all(
                    photos.map(photo => compressImage(photo))
                );

                // 3. Upload images to Cloudinary
                setUploadProgress('Uploading images...');
                const imageUrls = await Promise.all(
                    compressedPhotos.map(file => uploadImage(file))
                );

                setUploadProgress('Analyzing category...');
                const category = await categorizeListing(formData.title, formData.description);

                setUploadProgress('Creating listing...');

                // 2. Insert into Supabase
                const { error } = await supabase.from('listings').insert([
                    {
                        title: formData.title,
                        description: formData.description,
                        college: formData.college,
                        price: parseFloat(formData.price),
                        category: category,
                        seller_id: user.uid || user.id, // Use ID from AuthContext
                        seller_name: user.displayName || user.name || 'Anonymous',
                        images: imageUrls,
                        status: 'active'
                    }
                ]);

                if (error) throw error;

                setShowToast(true);
                setTimeout(() => navigate('/'), 2000);
            } catch (err) {
                console.error('Error creating listing:', err);
                setErrors(prev => ({
                    ...prev,
                    submit: err.message || 'Failed to create listing. Please try again.'
                }));
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="page">
            {showToast && (
                <Toast
                    message="Listing created successfully!"
                    type="success"
                    onClose={() => setShowToast(false)}
                />
            )}

            <div className="container">
                <div className="create-listing-container">
                    <h1 className="page-title">Create Listing</h1>
                    <p className="page-subtitle">List your item for sale</p>

                    <form onSubmit={handleSubmit} className="listing-form">
                        <Input
                            label="Title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g., College Hoodie - Navy Blue"
                            error={errors.title}
                            required
                        />

                        <div className="input-group">
                            <label className="input-label">
                                Description<span className="required">*</span>
                            </label>
                            <textarea
                                className={`input ${errors.description ? 'input-error' : ''}`}
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                placeholder="Describe your item in detail..."
                                rows="5"
                            />
                            {errors.description && (
                                <span className="error-message">{errors.description}</span>
                            )}
                        </div>

                        <CollegeSelector
                            value={formData.college}
                            onChange={(value) => setFormData(prev => ({ ...prev, college: value }))}
                            error={errors.college}
                            required
                        />

                        <Input
                            label="Price"
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={handleInputChange}
                            placeholder="0"
                            error={errors.price}
                            required
                            step="1"
                            min="0"
                            onWheel={(e) => e.target.blur()}
                            onKeyDown={(e) => ['e', 'E', '+', '-', '.'].includes(e.key) && e.preventDefault()}
                        />

                        <div className="input-group">
                            <label className="input-label">
                                Photos<span className="required">*</span>
                                <span className="text-gray-500 font-normal ml-2">
                                    (Min 3 photos, max 5MB each. The first photo is the cover photo.)
                                </span>
                            </label>

                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoUpload}
                                className="file-input"
                            />

                            {errors.photos && (
                                <span className="error-message">{errors.photos}</span>
                            )}

                            {previewUrls.length > 0 && (
                                <div className="photo-previews">
                                    {previewUrls.map((url, index) => (
                                        <div key={index} className="photo-preview">
                                            <img src={url} alt={`Preview ${index + 1}`} />
                                            <button
                                                type="button"
                                                className="remove-photo"
                                                onClick={() => removePhoto(index)}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <p className="text-sm text-gray-600 mt-2">
                                {photos.length} photo{photos.length !== 1 ? 's' : ''} uploaded
                            </p>
                        </div>

                        {errors.submit && (
                            <div className="p-3 bg-red-100 text-red-700 rounded-md">
                                {errors.submit}
                            </div>
                        )}

                        <div className="form-actions">
                            <Button type="submit" fullWidth disabled={isSubmitting}>
                                {isSubmitting ? uploadProgress : 'Create Listing'}
                            </Button>
                            <Button variant="ghost" type="button" onClick={() => navigate('/')} fullWidth disabled={isSubmitting}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateListingPage;
