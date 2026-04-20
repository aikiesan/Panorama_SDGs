import { adminAPI } from '../services/api/admin';

export const downloadProjectsCSV = async () => {
  try {
    const data = await adminAPI.getAllProjects(1, 1000);
    const projects = data.projects;

    if (projects.length === 0) {
      alert("No projects to export.");
      return;
    }

    const headers = [
      "Project ID",
      "Project Name",
      "Organization",
      "Contact Person",
      "Contact Email",
      "Status",
      "Workflow Status",
      "Region",
      "City",
      "Country",
      "Latitude",
      "Longitude",
      "Funding Needed",
      "Funding Spent",
      "Brief Description",
      "Typologies",
      "SDGs",
      "Created At"
    ];

    const escapeCsv = (str: string | null | undefined | number): string => {
      if (str === null || str === undefined) return '';
      const stringValue = String(str);
      // Replace double quotes with two double quotes, and newlines with spaces
      // Use split/join to avoid regex literals that might cause tool parsing issues
      const escapedValue = stringValue.split('"').join('""').split('\n').join(' ');
      return `"${escapedValue}"`;
    };

    const csvRows = projects.map(p => [
      p.id,
      escapeCsv(p.projectName),
      escapeCsv(p.organizationName),
      escapeCsv(p.contactPerson),
      escapeCsv(p.contactEmail),
      escapeCsv(p.projectStatus),
      escapeCsv(p.workflowStatus),
      escapeCsv(p.uiaRegion),
      escapeCsv(p.city),
      escapeCsv(p.country),
      p.latitude || '', // numbers/nulls don't need escaping, but ensure fallback
      p.longitude || '',
      p.fundingNeeded || 0,
      p.fundingSpent || 0,
      escapeCsv(p.briefDescription),
      escapeCsv((p.typologies || []).join(', ')),
      escapeCsv((p.sdgs || []).join(', ')),
      escapeCsv(p.createdAt)
    ].join(','));

    const csvString = [headers.join(','), ...csvRows].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `panorama_sdg_projects_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  } catch (error) {
    console.error("Export failed:", error);
    alert("Failed to export data.");
  }
};
