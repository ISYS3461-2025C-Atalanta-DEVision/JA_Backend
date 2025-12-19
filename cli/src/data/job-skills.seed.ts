/**
 * Seed data for Job Categories and Skills
 * Icons use Lucide icon names (https://lucide.dev/icons/)
 */

export interface SeedJobCategory {
  name: string;
  slug: string;
  icon: string;
  description: string;
}

export interface SeedSkill {
  name: string;
  icon: string;
  description?: string;
}

export interface SeedSkillsByCategory {
  [categoryName: string]: SeedSkill[];
}

/**
 * Job Categories (11 total)
 */
export const JOB_CATEGORIES: SeedJobCategory[] = [
  {
    name: 'IT',
    slug: 'it',
    icon: 'laptop',
    description: 'Information Technology & Software Development',
  },
  {
    name: 'Healthcare',
    slug: 'healthcare',
    icon: 'heart-pulse',
    description: 'Medical & Health Services',
  },
  {
    name: 'Finance',
    slug: 'finance',
    icon: 'banknote',
    description: 'Banking, Accounting & Financial Services',
  },
  {
    name: 'Sales',
    slug: 'sales',
    icon: 'megaphone',
    description: 'Sales & Business Development',
  },
  {
    name: 'HR',
    slug: 'hr',
    icon: 'users',
    description: 'Human Resources & Recruitment',
  },
  {
    name: 'Education',
    slug: 'education',
    icon: 'graduation-cap',
    description: 'Teaching & Training',
  },
  {
    name: 'Marketing',
    slug: 'marketing',
    icon: 'target',
    description: 'Marketing & Advertising',
  },
  {
    name: 'Engineering',
    slug: 'engineering',
    icon: 'wrench',
    description: 'Mechanical & Civil Engineering',
  },
  {
    name: 'Design',
    slug: 'design',
    icon: 'palette',
    description: 'UI/UX & Graphic Design',
  },
  {
    name: 'Legal',
    slug: 'legal',
    icon: 'scale',
    description: 'Law & Compliance',
  },
  {
    name: 'Customer Service',
    slug: 'customer-service',
    icon: 'headphones',
    description: 'Support & Client Relations',
  },
];

/**
 * Skills by Category (10 skills per category = 110 total)
 */
export const SKILLS_BY_CATEGORY: SeedSkillsByCategory = {
  IT: [
    { name: 'JavaScript', icon: 'code' },
    { name: 'TypeScript', icon: 'code' },
    { name: 'Python', icon: 'terminal' },
    { name: 'Java', icon: 'coffee' },
    { name: 'AWS', icon: 'cloud' },
    { name: 'Docker', icon: 'container' },
    { name: 'React', icon: 'atom' },
    { name: 'Node.js', icon: 'server' },
    { name: 'SQL', icon: 'database' },
    { name: 'Git', icon: 'git-branch' },
  ],
  Healthcare: [
    { name: 'Patient Care', icon: 'heart-handshake' },
    { name: 'Medical Records', icon: 'file-text' },
    { name: 'HIPAA Compliance', icon: 'shield-check' },
    { name: 'Clinical Research', icon: 'microscope' },
    { name: 'Nursing', icon: 'stethoscope' },
    { name: 'Pharmacy', icon: 'pill' },
    { name: 'Radiology', icon: 'scan' },
    { name: 'First Aid', icon: 'cross' },
    { name: 'EMR Systems', icon: 'monitor' },
    { name: 'Telemedicine', icon: 'video' },
  ],
  Finance: [
    { name: 'Financial Analysis', icon: 'chart-line' },
    { name: 'Accounting', icon: 'calculator' },
    { name: 'Excel', icon: 'table' },
    { name: 'QuickBooks', icon: 'receipt' },
    { name: 'Tax Preparation', icon: 'file-spreadsheet' },
    { name: 'Budgeting', icon: 'piggy-bank' },
    { name: 'Auditing', icon: 'search' },
    { name: 'Risk Management', icon: 'alert-triangle' },
    { name: 'SAP', icon: 'boxes' },
    { name: 'Financial Modeling', icon: 'trending-up' },
  ],
  Sales: [
    { name: 'CRM', icon: 'contact' },
    { name: 'Salesforce', icon: 'cloud' },
    { name: 'Lead Generation', icon: 'user-plus' },
    { name: 'Negotiation', icon: 'handshake' },
    { name: 'Cold Calling', icon: 'phone-outgoing' },
    { name: 'B2B Sales', icon: 'building' },
    { name: 'Account Management', icon: 'briefcase' },
    { name: 'Presentation', icon: 'presentation' },
    { name: 'Pipeline Management', icon: 'git-branch' },
    { name: 'HubSpot', icon: 'circle-dot' },
  ],
  HR: [
    { name: 'Recruiting', icon: 'user-search' },
    { name: 'Onboarding', icon: 'user-check' },
    { name: 'Payroll', icon: 'wallet' },
    { name: 'HRIS', icon: 'database' },
    { name: 'Employee Relations', icon: 'users' },
    { name: 'Performance Management', icon: 'target' },
    { name: 'Benefits Administration', icon: 'heart' },
    { name: 'Compliance', icon: 'shield-check' },
    { name: 'Workday', icon: 'calendar' },
    { name: 'ATS', icon: 'filter' },
  ],
  Education: [
    { name: 'Curriculum Design', icon: 'book-open' },
    { name: 'Classroom Management', icon: 'school' },
    { name: 'E-Learning', icon: 'monitor-play' },
    { name: 'LMS', icon: 'layout-dashboard' },
    { name: 'Student Assessment', icon: 'clipboard-check' },
    { name: 'Tutoring', icon: 'user' },
    { name: 'Special Education', icon: 'accessibility' },
    { name: 'EdTech', icon: 'tablet' },
    { name: 'Lesson Planning', icon: 'calendar' },
    { name: 'Instructional Design', icon: 'pen-tool' },
  ],
  Marketing: [
    { name: 'Digital Marketing', icon: 'globe' },
    { name: 'SEO', icon: 'search' },
    { name: 'Content Marketing', icon: 'file-text' },
    { name: 'Social Media', icon: 'share-2' },
    { name: 'Email Marketing', icon: 'mail' },
    { name: 'Google Analytics', icon: 'chart-bar' },
    { name: 'PPC Advertising', icon: 'mouse-pointer-click' },
    { name: 'Brand Management', icon: 'badge' },
    { name: 'Marketing Automation', icon: 'bot' },
    { name: 'Copywriting', icon: 'pen' },
  ],
  Engineering: [
    { name: 'CAD', icon: 'ruler' },
    { name: 'AutoCAD', icon: 'pencil-ruler' },
    { name: 'Project Management', icon: 'gantt-chart' },
    { name: 'Quality Control', icon: 'check-circle' },
    { name: 'Manufacturing', icon: 'factory' },
    { name: 'Mechanical Design', icon: 'cog' },
    { name: 'Civil Engineering', icon: 'building' },
    { name: 'Electrical Systems', icon: 'zap' },
    { name: '3D Modeling', icon: 'box' },
    { name: 'Technical Drawing', icon: 'drafting-compass' },
  ],
  Design: [
    { name: 'UI Design', icon: 'layout' },
    { name: 'UX Design', icon: 'mouse-pointer' },
    { name: 'Figma', icon: 'figma' },
    { name: 'Adobe Photoshop', icon: 'image' },
    { name: 'Adobe Illustrator', icon: 'pen-tool' },
    { name: 'Sketch', icon: 'diamond' },
    { name: 'Prototyping', icon: 'smartphone' },
    { name: 'Wireframing', icon: 'layout-grid' },
    { name: 'Typography', icon: 'type' },
    { name: 'Color Theory', icon: 'paintbrush' },
  ],
  Legal: [
    { name: 'Contract Law', icon: 'file-signature' },
    { name: 'Corporate Law', icon: 'building' },
    { name: 'Litigation', icon: 'gavel' },
    { name: 'Legal Research', icon: 'search' },
    { name: 'Compliance', icon: 'shield-check' },
    { name: 'Intellectual Property', icon: 'lightbulb' },
    { name: 'Due Diligence', icon: 'clipboard-list' },
    { name: 'Legal Writing', icon: 'file-text' },
    { name: 'Paralegal', icon: 'folder' },
    { name: 'Regulatory Affairs', icon: 'scroll' },
  ],
  'Customer Service': [
    { name: 'Phone Support', icon: 'phone' },
    { name: 'Live Chat', icon: 'message-circle' },
    { name: 'Email Support', icon: 'mail' },
    { name: 'Zendesk', icon: 'life-buoy' },
    { name: 'Conflict Resolution', icon: 'handshake' },
    { name: 'CRM', icon: 'contact' },
    { name: 'Technical Support', icon: 'wrench' },
    { name: 'Multilingual', icon: 'languages' },
    { name: 'Customer Retention', icon: 'heart' },
    { name: 'Ticketing Systems', icon: 'ticket' },
  ],
};
