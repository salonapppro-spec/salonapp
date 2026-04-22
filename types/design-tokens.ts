export interface DesignTokens {
  /** Brand color — hex, e.g. "#F2A58E" */
  primaryColor: string;
  /** Page / section background */
  backgroundColor: string;
  /** Main body text color */
  textColor: string;
  /** Accent / secondary color */
  accentColor: string;
  /** CSS font-family string */
  fontFamily: string;
  /** Hero heading — CSS font-size with unit */
  headingSize: string;
  /** Body copy — CSS font-size with unit */
  bodySize: string;
  /** Global border-radius — CSS value, e.g. "0.75rem" */
  borderRadius: string;
  /** Button padding — CSS shorthand, e.g. "0.6rem 1.5rem" */
  buttonPadding: string;
  /** Section vertical padding — CSS value, e.g. "4rem" */
  sectionPadding: string;
}
