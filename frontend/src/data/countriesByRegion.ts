export const REGION_LABELS: Record<string, string> = {
  SECTION_I:   'Section I - Western Europe',
  SECTION_II:  'Section II - Eastern Europe & Central Asia',
  SECTION_III: 'Section III - Middle East & Africa',
  SECTION_IV:  'Section IV - Asia & Pacific',
  SECTION_V:   'Section V - Americas',
};

export const COUNTRIES_BY_REGION: Record<string, string[]> = {
  SECTION_I: [
    'Andorra', 'Austria', 'Belgium', 'Cyprus', 'Denmark', 'Finland', 'France',
    'Germany', 'Greece', 'Iceland', 'Ireland', 'Italy', 'Liechtenstein',
    'Luxembourg', 'Malta', 'Monaco', 'Netherlands', 'Norway', 'Portugal',
    'San Marino', 'Spain', 'Sweden', 'Switzerland', 'United Kingdom',
  ],
  SECTION_II: [
    'Albania', 'Armenia', 'Azerbaijan', 'Belarus', 'Bosnia and Herzegovina',
    'Bulgaria', 'Croatia', 'Czech Republic', 'Estonia', 'Georgia', 'Hungary',
    'Kazakhstan', 'Kosovo', 'Kyrgyzstan', 'Latvia', 'Lithuania', 'Moldova',
    'Montenegro', 'North Macedonia', 'Poland', 'Romania', 'Russia', 'Serbia',
    'Slovakia', 'Slovenia', 'Tajikistan', 'Turkey', 'Turkmenistan', 'Ukraine', 'Uzbekistan',
  ],
  SECTION_III: [
    // Africa
    'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi',
    'Cabo Verde', 'Cameroon', 'Central African Republic', 'Chad', 'Comoros',
    'Congo', 'DR Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea', 'Eritrea',
    'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea',
    'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya',
    'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco',
    'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'São Tomé and Príncipe',
    'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa',
    'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda',
    'Zambia', 'Zimbabwe',
    // Middle East
    'Bahrain', 'Iran', 'Iraq', 'Israel', 'Jordan', 'Kuwait', 'Lebanon',
    'Oman', 'Palestine', 'Qatar', 'Saudi Arabia', 'Syria',
    'United Arab Emirates', 'Yemen',
  ],
  SECTION_IV: [
    'Afghanistan', 'Australia', 'Bangladesh', 'Bhutan', 'Brunei', 'Cambodia',
    'China', 'Fiji', 'Hong Kong', 'India', 'Indonesia', 'Japan', 'Laos',
    'Malaysia', 'Maldives', 'Mongolia', 'Myanmar', 'Nepal', 'New Zealand',
    'North Korea', 'Pakistan', 'Papua New Guinea', 'Philippines', 'Samoa',
    'Singapore', 'South Korea', 'Sri Lanka', 'Taiwan', 'Thailand',
    'Timor-Leste', 'Tonga', 'Vanuatu', 'Vietnam',
  ],
  SECTION_V: [
    'Antigua and Barbuda', 'Argentina', 'Bahamas', 'Barbados', 'Belize',
    'Bolivia', 'Brazil', 'Canada', 'Chile', 'Colombia', 'Costa Rica', 'Cuba',
    'Dominica', 'Dominican Republic', 'Ecuador', 'El Salvador', 'Grenada',
    'Guatemala', 'Guyana', 'Haiti', 'Honduras', 'Jamaica', 'Mexico',
    'Nicaragua', 'Panama', 'Paraguay', 'Peru', 'Saint Kitts and Nevis',
    'Saint Lucia', 'Saint Vincent and the Grenadines', 'Suriname',
    'Trinidad and Tobago', 'United States', 'Uruguay', 'Venezuela',
  ],
};

export const countryList = (regionCode: string): string[] =>
  [...(COUNTRIES_BY_REGION[regionCode] ?? [])].sort();

// Reverse map: human-readable label → internal code (for edit/load flows)
export const REGION_CODE_FROM_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(REGION_LABELS).map(([code, label]) => [label, code])
);
