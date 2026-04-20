import { useState, useEffect, useRef } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import ReCAPTCHA from 'react-google-recaptcha';
import { projectsApi, type ProjectCreate } from '../../services/api/projects';
import {
  PROJECT_STATUSES,
  TYPOLOGIES,
  FUNDING_REQUIREMENTS,
  GOVERNMENT_REQUIREMENTS,
  OTHER_REQUIREMENTS,
  SDGS,
} from '../../utils/constants';
import { REGION_LABELS, countryList } from '../../data/countriesByRegion';

interface ProjectFormProps {
  initialValues?: Partial<ProjectCreate>;
  onSubmit: (data: ProjectCreate) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
  isPublicSubmission?: boolean;
  submitLabel?: string;
}

const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

export default function ProjectForm({
  initialValues,
  onSubmit,
  isSubmitting,
  submitError,
  isPublicSubmission = false,
  submitLabel = 'Submit Project',
}: ProjectFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ProjectCreate>({
    defaultValues: {
      sdgs: [],
      typologies: [],
      funding_requirements: [],
      government_requirements: [],
      other_requirements: [],
      image_urls: [],
      gdpr_consent: false,
      ...initialValues,
    },
  });

  useEffect(() => {
    if (initialValues) {
      reset({
        sdgs: [],
        typologies: [],
        funding_requirements: [],
        government_requirements: [],
        other_requirements: [],
        image_urls: [],
        gdpr_consent: false,
        ...initialValues,
      });
    }
  }, [initialValues, reset]);

  const selectedSDGs = watch('sdgs');
  const imageUrls = watch('image_urls') || [];
  const watchedRegion = watch('uia_region');
  const watchedBrief = watch('brief_description') ?? '';
  const watchedTypologies = watch('typologies') || [];
  const watchedFunding = watch('funding_requirements') || [];
  const watchedGovt = watch('government_requirements') || [];

  // Reset country when region changes
  useEffect(() => {
    setValue('country', '');
  }, [watchedRegion, setValue]);

  const onFormSubmit: SubmitHandler<ProjectCreate> = async (data) => {
    if (isPublicSubmission && !captchaToken) {
      alert('Please verify that you are not a robot.');
      return;
    }
    await onSubmit({ ...data, captcha_token: captchaToken || undefined });
  };

  const toggleSDG = (id: number) => {
    const current = selectedSDGs || [];
    setValue('sdgs', current.includes(id) ? current.filter(s => s !== id) : [...current, id]);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploading(true);
    const newUrls = [...imageUrls];
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 5 * 1024 * 1024) {
        alert(`${files[i].name} exceeds the 5 MB limit and was skipped.`);
        continue;
      }
      try {
        const result = await projectsApi.uploadImage(files[i]);
        newUrls.push(result.url);
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail || `Failed to upload ${files[i].name}`;
        alert(errorMessage);
      }
    }
    setValue('image_urls', newUrls);
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    const newUrls = [...imageUrls];
    newUrls.splice(index, 1);
    setValue('image_urls', newUrls);
  };

  const SELECT_CLASSES = "input-uia appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20stroke%3D%22%236b7280%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%221.5%22%20d%3D%22m6%208%204%204%204-4%22%2F%3E%3C%2Fsvg%3E')] bg-[position:right_0.5rem_center] bg-[length:1.5em_1.5em] bg-no-repeat pr-10";
  const countries = watchedRegion ? countryList(watchedRegion) : [];

  return (
    <div className="max-w-4xl mx-auto">
      {submitError && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-900/50 text-red-400 rounded-md">
          {submitError}
        </div>
      )}

      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-12 bg-white p-8 md:p-12 border-2 border-uia-dark/10 shadow-uia-card">

        {/* Contact Information */}
        <section>
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-uia-blue mb-8 pb-3 border-b-2 border-uia-blue/10">
            Contact Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block font-display font-bold text-xs uppercase text-uia-dark tracking-wide mb-2">Organization Name</label>
              <input
                type="text"
                {...register('organization_name', { required: 'Organization name is required' })}
                className="input-uia"
                placeholder="Name of your organization"
              />
              {errors.organization_name && <p className="mt-2 text-xs font-bold text-uia-red uppercase tracking-tight">{errors.organization_name.message}</p>}
            </div>

            <div>
              <label className="block font-display font-bold text-xs uppercase text-uia-dark tracking-wide mb-2">Contact Person</label>
              <input
                type="text"
                {...register('contact_person', { required: 'Contact person is required' })}
                className="input-uia"
                placeholder="First and Last Name"
              />
              {errors.contact_person && <p className="mt-2 text-xs font-bold text-uia-red uppercase tracking-tight">{errors.contact_person.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block font-display font-bold text-xs uppercase text-uia-dark tracking-wide mb-2">Contact Email</label>
              <input
                type="email"
                {...register('contact_email', {
                  required: 'Email is required',
                  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' },
                })}
                className="input-uia"
                placeholder="email@example.com"
              />
              {errors.contact_email && <p className="mt-2 text-xs font-bold text-uia-red uppercase tracking-tight">{errors.contact_email.message}</p>}
            </div>
          </div>
        </section>

        {/* Project Basics */}
        <section>
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-uia-blue mb-8 pb-3 border-b-2 border-uia-blue/10">
            Project Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block font-display font-bold text-xs uppercase text-uia-dark tracking-wide mb-2">Project Name</label>
              <input
                type="text"
                {...register('project_name', { required: 'Project name is required' })}
                className="input-uia"
                placeholder="Enter the project's full title"
              />
              {errors.project_name && <p className="mt-2 text-xs font-bold text-uia-red uppercase tracking-tight">{errors.project_name.message}</p>}
            </div>

            <div className="md:col-span-2">
              <label className="block font-display font-bold text-xs uppercase text-uia-dark tracking-wide mb-2">Project Status</label>
              <select
                {...register('project_status', { required: 'Status is required' })}
                className={SELECT_CLASSES}
              >
                <option value="">Select Status</option>
                {PROJECT_STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
              {errors.project_status && <p className="mt-2 text-xs font-bold text-uia-red uppercase tracking-tight">{errors.project_status.message}</p>}
            </div>
          </div>
        </section>

        {/* Location */}
        <section>
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-uia-blue mb-8 pb-3 border-b-2 border-uia-blue/10">
            Location
          </h2>
          <p className="font-sans text-sm text-uia-dark/70 mb-6">
            Select your UIA region, then choose the country and type your project city. Coordinates will be assigned by UIA staff.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="md:col-span-2">
              <label className="block font-display font-bold text-xs uppercase text-uia-dark tracking-wide mb-2">UIA Region</label>
              <select
                {...register('uia_region', { required: 'Region is required' })}
                className={SELECT_CLASSES}
              >
                <option value="">Select Region</option>
                {Object.entries(REGION_LABELS).map(([code, label]) => (
                  <option key={code} value={code}>{label}</option>
                ))}
              </select>
              {errors.uia_region && <p className="mt-2 text-xs font-bold text-uia-red uppercase tracking-tight">{errors.uia_region.message}</p>}
            </div>

            <div>
              <label className="block font-display font-bold text-xs uppercase text-uia-dark tracking-wide mb-2">Country</label>
              <select
                {...register('country', { required: 'Country is required' })}
                className={SELECT_CLASSES}
                disabled={!watchedRegion}
              >
                <option value="">{watchedRegion ? 'Select Country' : 'Select a region first'}</option>
                {countries.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              {errors.country && <p className="mt-2 text-xs font-bold text-uia-red uppercase tracking-tight">{errors.country.message}</p>}
            </div>

            <div>
              <label className="block font-display font-bold text-xs uppercase text-uia-dark tracking-wide mb-2">City</label>
              <input
                type="text"
                {...register('city', { required: 'City is required' })}
                className="input-uia"
                placeholder="City name"
              />
              {errors.city && <p className="mt-2 text-xs font-bold text-uia-red uppercase tracking-tight">{errors.city.message}</p>}
            </div>
          </div>
        </section>

        {/* Description */}
        <section>
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-uia-blue mb-8 pb-3 border-b-2 border-uia-blue/10">
            Description
          </h2>
          <div className="space-y-8">
            <div>
              <label className="block font-display font-bold text-xs uppercase text-uia-dark tracking-wide mb-2">Brief Description (Summary)</label>
              <textarea
                rows={3}
                {...register('brief_description', {
                  required: 'Brief description is required',
                  maxLength: { value: 100, message: 'Brief description must be 100 characters or fewer' },
                })}
                className="input-uia min-h-[100px]"
                placeholder="Summarize the project's goal and impact (max 100 characters)"
                maxLength={100}
              />
              <p className={`text-xs text-right mt-1 ${watchedBrief.length >= 90 ? 'text-uia-red font-bold' : 'text-gray-400'}`}>
                {watchedBrief.length}/100
              </p>
              {errors.brief_description && <p className="mt-1 text-xs font-bold text-uia-red uppercase tracking-tight">{errors.brief_description.message}</p>}
            </div>

            <div>
              <label className="block font-display font-bold text-xs uppercase text-uia-dark tracking-wide mb-2">Detailed Description</label>
              <textarea
                rows={6}
                {...register('detailed_description', { required: 'Detailed description is required' })}
                className="input-uia min-h-[200px]"
                placeholder="Provide a comprehensive description of the project"
              />
              {errors.detailed_description && <p className="mt-2 text-xs font-bold text-uia-red uppercase tracking-tight">{errors.detailed_description.message}</p>}
            </div>

            <div>
              <label className="block font-display font-bold text-xs uppercase text-uia-dark tracking-wide mb-2">Success Factors</label>
              <textarea
                rows={4}
                {...register('success_factors', { required: 'Success factors are required' })}
                className="input-uia min-h-[150px]"
                placeholder="What makes this project successful? (e.g. Community involvement, innovative technology...)"
              />
              {errors.success_factors && <p className="mt-2 text-xs font-bold text-uia-red uppercase tracking-tight">{errors.success_factors.message}</p>}
            </div>
          </div>
        </section>

        {/* SDGs */}
        <section>
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-uia-blue mb-8 pb-3 border-b-2 border-uia-blue/10">
            Sustainable Development Goals
          </h2>
          <p className="font-sans text-sm text-uia-dark mb-6">Select all UN Sustainable Development Goals that apply to this project.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {SDGS.map(sdg => (
              <div
                key={sdg.id}
                onClick={() => toggleSDG(sdg.id)}
                className={`cursor-pointer group flex flex-col items-center p-4 transition-all duration-200 border-2 ${selectedSDGs?.includes(sdg.id)
                    ? 'border-uia-blue bg-uia-blue/5 scale-[1.02]'
                    : 'border-transparent bg-uia-gray-light hover:bg-white hover:border-uia-dark/20'
                }`}
              >
                <div
                  className="w-12 h-12 flex items-center justify-center text-white font-display font-bold text-xl shadow-sm mb-3"
                  style={{ backgroundColor: sdg.color }}
                >
                  {sdg.id}
                </div>
                <span className={`text-[10px] font-display font-bold uppercase text-center leading-tight tracking-tight ${selectedSDGs?.includes(sdg.id) ? 'text-uia-blue' : 'text-uia-dark'}`}>
                  {sdg.name}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Categorization & Requirements */}
        <section>
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-uia-blue mb-8 pb-3 border-b-2 border-uia-blue/10">
            Categorization & Requirements
          </h2>
          <div className="space-y-8">
            <div className="bg-uia-gray-light/30 p-6 md:p-8 border-l-5 border-uia-blue shadow-sm">
              <label className="block font-display font-bold text-sm uppercase text-uia-blue tracking-widest mb-6">
                Project Typologies
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                {TYPOLOGIES.map(type => (
                  <label key={type} className="inline-flex items-center group cursor-pointer">
                    <input
                      type="checkbox"
                      value={type}
                      {...register('typologies')}
                      className="form-checkbox h-5 w-5 text-uia-blue border-gray-300 focus:ring-uia-blue rounded-none transition duration-150 ease-in-out"
                    />
                    <span className="ml-3 font-sans text-sm text-gray-700 group-hover:text-uia-blue transition-colors font-medium">{type}</span>
                  </label>
                ))}
              </div>
              {watchedTypologies.includes('Others') && (
                <div className="mt-4">
                  <input
                    type="text"
                    {...register('other_typology_text')}
                    className="input-uia"
                    placeholder="Please describe the other typology..."
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 border-l-5 border-uia-violet shadow-sm">
                <label className="block font-display font-bold text-xs uppercase text-uia-violet tracking-wider mb-5 pb-2 border-b border-uia-violet/10">
                  Funding Needs
                </label>
                <div className="space-y-3.5">
                  {FUNDING_REQUIREMENTS.map(req => (
                    <label key={req} className="inline-flex items-center group cursor-pointer w-full">
                      <input
                        type="checkbox"
                        value={req}
                        {...register('funding_requirements')}
                        className="form-checkbox h-4 w-4 text-uia-violet border-gray-300 focus:ring-uia-violet rounded-none"
                      />
                      <span className="ml-3 font-sans text-xs text-gray-600 group-hover:text-uia-violet transition-colors">{req}</span>
                    </label>
                  ))}
                </div>
                {watchedFunding.includes('Others') && (
                  <div className="mt-3">
                    <input
                      type="text"
                      {...register('other_funding_text')}
                      className="input-uia text-xs"
                      placeholder="Describe other funding need..."
                    />
                  </div>
                )}
              </div>

              <div className="bg-white p-6 border-l-5 border-uia-dark shadow-sm">
                <label className="block font-display font-bold text-xs uppercase text-uia-dark tracking-wider mb-5 pb-2 border-b border-uia-dark/10">
                  Government Support
                </label>
                <div className="space-y-3.5">
                  {GOVERNMENT_REQUIREMENTS.map(req => (
                    <label key={req} className="inline-flex items-center group cursor-pointer w-full">
                      <input
                        type="checkbox"
                        value={req}
                        {...register('government_requirements')}
                        className="form-checkbox h-4 w-4 text-uia-dark border-gray-300 focus:ring-uia-dark rounded-none"
                      />
                      <span className="ml-3 font-sans text-xs text-gray-600 group-hover:text-uia-dark transition-colors">{req}</span>
                    </label>
                  ))}
                </div>
                {watchedGovt.includes('Others') && (
                  <div className="mt-3">
                    <input
                      type="text"
                      {...register('other_gov_text')}
                      className="input-uia text-xs"
                      placeholder="Describe other government support needed..."
                    />
                  </div>
                )}
              </div>

              <div className="bg-white p-6 border-l-5 border-gray-400 shadow-sm">
                <label className="block font-display font-bold text-xs uppercase text-gray-600 tracking-wider mb-5 pb-2 border-b border-gray-200">
                  Other Support
                </label>
                <div className="space-y-3.5">
                  {OTHER_REQUIREMENTS.map(req => (
                    <label key={req} className="inline-flex items-center group cursor-pointer w-full">
                      <input
                        type="checkbox"
                        value={req}
                        {...register('other_requirements')}
                        className="form-checkbox h-4 w-4 text-gray-500 border-gray-300 focus:ring-gray-400 rounded-none"
                      />
                      <span className="ml-3 font-sans text-xs text-gray-600 group-hover:text-gray-900 transition-colors">{req}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <label className="block font-display font-bold text-xs uppercase text-uia-dark tracking-wide mb-2">Other Requirement Details</label>
              <input
                type="text"
                {...register('other_requirement_text')}
                className="input-uia"
                placeholder="Specify any other specific needs or technical expertise required..."
              />
            </div>
          </div>
        </section>

        {/* Media */}
        <section>
          <h2 className="text-2xl font-display font-bold uppercase tracking-wider text-uia-blue mb-8 pb-3 border-b-2 border-uia-blue/10">
            Project Images
          </h2>
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imageUrls.map((url, index) => (
                <div key={index} className="relative aspect-square bg-gray-100 group">
                  <img src={url} alt={`Project ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-uia-red text-white p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="aspect-square border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-uia-blue hover:bg-uia-blue/5 transition-all group"
              >
                {isUploading ? (
                  <svg className="animate-spin h-8 w-8 text-uia-blue" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <>
                    <svg className="w-10 h-10 text-gray-400 group-hover:text-uia-blue mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-[10px] font-display font-bold uppercase text-gray-500 group-hover:text-uia-blue">Add Photo</span>
                  </>
                )}
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
            <p className="font-sans text-xs text-uia-dark/60 italic">
              Upload up to 5 high-quality images of your project. JPG, PNG or WebP, max 5MB each.
            </p>
          </div>
        </section>

        {/* Data Privacy & Consent */}
        {isPublicSubmission && (
          <section>
            <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 space-y-4">
              <h3 className="font-display font-bold text-lg uppercase tracking-wider text-uia-dark">Data Privacy & Consent</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                By submitting this form, UIA (Union Internationale des Architectes) will collect, store and may publish
                the information above for the Panorama SDG initiative. Data is processed in accordance with applicable
                data protection legislation, including the LGPD (Lei Geral de Proteção de Dados) and GDPR.
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                <li>You may request access, correction or deletion of your data at any time.</li>
                <li>Data is stored securely and only shared with UIA member organisations.</li>
                <li>Submitted project information may appear publicly on the Panorama SDG map.</li>
              </ul>
              <div className="flex gap-6 text-sm pt-1">
                <a
                  href="https://www.uia-architectes.org/en/privacy-policy/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-uia-blue underline hover:text-uia-violet transition-colors font-medium"
                >
                  Privacy Policy
                </a>
                <a
                  href="https://www.uia-architectes.org/en/terms-of-use/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-uia-blue underline hover:text-uia-violet transition-colors font-medium"
                >
                  Terms of Use
                </a>
              </div>
              <label className="flex items-start gap-3 cursor-pointer group pt-1">
                <input
                  type="checkbox"
                  {...register('gdpr_consent', { required: 'You must accept the terms to submit.' })}
                  className="mt-0.5 h-5 w-5 text-uia-blue border-gray-300 focus:ring-uia-blue rounded-none flex-shrink-0"
                />
                <span className="text-sm font-medium text-gray-800 group-hover:text-uia-blue transition-colors leading-relaxed">
                  I have read and accept the Privacy Policy and Terms of Use, and I consent to UIA processing
                  and publishing my project data as described above.
                </span>
              </label>
              {errors.gdpr_consent && (
                <p className="text-xs font-bold text-uia-red uppercase tracking-tight">{errors.gdpr_consent.message}</p>
              )}
            </div>
          </section>
        )}

        {/* reCAPTCHA */}
        {isPublicSubmission && (
          <div className="flex flex-col items-center gap-2 pt-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-sans">Please verify you are not a robot to submit your project.</p>
            <ReCAPTCHA
              sitekey={RECAPTCHA_SITE_KEY}
              onChange={(token) => setCaptchaToken(token)}
              theme="light"
            />
          </div>
        )}

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`btn-uia-primary w-full py-4 text-base shadow-lg hover:shadow-xl transform active:scale-[0.98] ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing Submission...
              </span>
            ) : submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
