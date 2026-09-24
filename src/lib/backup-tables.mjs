/**
 * Tables a backup contains, shared by the admin download and the weekly
 * GitHub Action (scripts/backup.mjs). admin_users is exported without
 * password hashes; content_versions (history) is left out to keep files small.
 */
export const BACKUP_TABLES = [
  ["site_settings", "*"],
  ["nav_items", "*"],
  ["social_links", "*"],
  ["page_sections", "*"],
  ["roles", "*"],
  ["team_members", "*"],
  ["events", "*"],
  ["projects", "*"],
  ["project_members", "*"],
  ["announcements", "*"],
  ["content_seeds", "*"],
  ["problems", "*"],
  ["ideas", "*"],
  ["research_projects", "*"],
  ["working_teams", "*"],
  ["activity_items", "*"],
  ["submissions", "*"],
  ["email_templates", "*"],
  ["admin_users", "id,name,email,role,active,created_at,updated_at,last_login_at"],
  ["admin_audit", "*"],
];
