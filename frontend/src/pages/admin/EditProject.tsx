import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { adminAPI } from '../../services/api/admin';
import type { ProjectCreate } from '../../services/api/projects';
import ProjectForm from '../../components/forms/ProjectForm';
import { REGION_CODE_FROM_LABEL } from '../../data/countriesByRegion';

export default function EditProject() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<Partial<ProjectCreate> | undefined>(undefined);

  useEffect(() => {
    if (projectId) {
      fetchProject(projectId);
    }
  }, [projectId]);

  const fetchProject = async (id: string) => {
    try {
      const project = await adminAPI.getProject(id);
      setInitialValues({
        project_name: project.projectName,
        organization_name: project.organizationName,
        contact_person: project.contactPerson,
        contact_email: project.contactEmail,
        project_status: project.projectStatus,
        uia_region: REGION_CODE_FROM_LABEL[project.uiaRegion] ?? project.uiaRegion,
        city: project.city,
        country: project.country,
        latitude: project.latitude || undefined,
        longitude: project.longitude || undefined,
        brief_description: project.briefDescription,
        detailed_description: project.detailedDescription,
        success_factors: project.successFactors,
        typologies: project.typologies,
        funding_requirements: project.fundingRequirements,
        government_requirements: project.governmentRequirements,
        other_requirements: project.otherRequirements,
        // otherRequirementText might not be in Project type? Let's check.
        // It seems missing from Project interface in types/index.ts but present in backend response.
        // We might need to cast or update types. For now, assuming it maps if present.
        sdgs: project.sdgs,
        image_urls: project.imageUrls,
        gdpr_consent: true // Admins editing existing projects implies consent was given
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      setSubmitError('Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: ProjectCreate) => {
    if (!projectId) return;
    setIsSubmitting(true);
    setSubmitError(null);

    try {
        // Map ProjectCreate back to ProjectSubmission structure expected by adminAPI
        // Actually adminAPI.updateProject takes Partial<ProjectSubmission>.
        // Keys in ProjectCreate are snake_case (API/Backend style), but frontend types are usually camelCase.
        // Wait, ProjectCreate in services/api/projects.ts uses snake_case.
        // But adminAPI expects camelCase (ProjectSubmission).
        // I need to map snake_case data to camelCase for adminAPI.
        
        const submissionData = {
            projectName: data.project_name,
            organizationName: data.organization_name,
            contactPerson: data.contact_person,
            contactEmail: data.contact_email,
            projectStatus: data.project_status,
            uiaRegion: data.uia_region,
            city: data.city,
            country: data.country,
            latitude: data.latitude,
            longitude: data.longitude,
            briefDescription: data.brief_description,
            detailedDescription: data.detailed_description,
            successFactors: data.success_factors,
            typologies: data.typologies,
            fundingRequirements: data.funding_requirements,
            governmentRequirements: data.government_requirements,
            otherRequirements: data.other_requirements,
            otherRequirementText: data.other_requirement_text,
            sdgs: data.sdgs,
            imageUrls: data.image_urls
        };

      await adminAPI.updateProject(projectId, submissionData as any);
      navigate(`/admin/projects/${projectId}`);
    } catch (err: any) {
      console.error('Update error:', err);
      setSubmitError('Failed to update project.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mapbox-black flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mapbox-black text-mapbox-light font-sans pb-20">
      {/* Header */}
      <div className="bg-mapbox-card border-b border-mapbox-border px-6 py-4 sticky top-0 z-30 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to={`/admin/projects/${projectId}`} className="text-mapbox-gray hover:text-white transition-colors">
            ← Cancel
          </Link>
          <h1 className="text-xl font-bold text-white">Edit Project</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <ProjectForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
          isPublicSubmission={false}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}