/**
 * DOM-Safe HTML Sanitization & Element Builders for Map InfoWindows
 * 
 * Protects against XSS attacks where untrusted citizen inputs (such as title,
 * description, address, landmark, or contact information) might contain
 * malicious script tags, event handlers, or encoded HTML payloads.
 */

import { Complaint, Hotspot } from '../types';

/**
 * Escapes unsafe characters in untrusted strings for safe interpolation in text contexts.
 */
export function escapeHtml(unsafe: unknown): string {
  if (unsafe === null || unsafe === undefined) return '';
  const str = String(unsafe);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitizes plain text input, returning a non-empty string or fallback.
 */
export function safeText(val: unknown, fallback = ''): string {
  if (val === null || val === undefined) return fallback;
  const str = String(val).trim();
  return str.length > 0 ? str : fallback;
}

/**
 * Constructs a DOM-safe InfoWindow container element for a Complaint.
 * Strictly uses document.createElement and element.textContent for all
 * user-controlled fields so that no untrusted input is parsed as HTML.
 */
export function createSafeComplaintInfoWindow(
  complaint: Complaint,
  onSelect?: (complaintId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'google-maps-infowindow-complaint';
  container.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.fontSize = '12px';
  container.style.padding = '8px 10px';
  container.style.maxWidth = '260px';
  container.style.color = '#0f172a';
  container.style.lineHeight = '1.4';

  // 1. Header: ID and Category Badge
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.gap = '8px';
  header.style.marginBottom = '6px';

  const idBadge = document.createElement('span');
  idBadge.style.fontWeight = '700';
  idBadge.style.fontSize = '11px';
  idBadge.style.fontFamily = 'ui-monospace, monospace';
  idBadge.style.color = '#1e293b';
  idBadge.textContent = safeText(complaint.id, 'SC-0000');

  const categoryBadge = document.createElement('span');
  categoryBadge.style.fontWeight = '600';
  categoryBadge.style.fontSize = '10px';
  categoryBadge.style.padding = '2px 6px';
  categoryBadge.style.borderRadius = '4px';
  categoryBadge.style.backgroundColor = '#f1f5f9';
  categoryBadge.style.color = '#334155';
  categoryBadge.style.whiteSpace = 'nowrap';
  categoryBadge.textContent = safeText(complaint.category, 'Civic Issue');

  header.appendChild(idBadge);
  header.appendChild(categoryBadge);
  container.appendChild(header);

  // 2. Title (USER-CONTROLLED - MUST USE textContent)
  const titleEl = document.createElement('div');
  titleEl.style.fontWeight = '700';
  titleEl.style.fontSize = '13px';
  titleEl.style.lineHeight = '1.3';
  titleEl.style.color = '#0f172a';
  titleEl.style.marginBottom = '6px';
  titleEl.textContent = safeText(complaint.title, 'Civic Complaint');
  container.appendChild(titleEl);

  // 3. Description (USER-CONTROLLED - MUST USE textContent)
  if (complaint.description) {
    const descEl = document.createElement('div');
    descEl.style.fontSize = '11px';
    descEl.style.color = '#64748b';
    descEl.style.lineHeight = '1.35';
    descEl.style.marginBottom = '6px';
    const truncated = complaint.description.length > 110
      ? `${complaint.description.slice(0, 110)}...`
      : complaint.description;
    descEl.textContent = truncated;
    container.appendChild(descEl);
  }

  // 4. Address & Landmark (USER-CONTROLLED - MUST USE textContent)
  const addressEl = document.createElement('div');
  addressEl.style.fontSize = '11px';
  addressEl.style.color = '#475569';
  addressEl.style.marginBottom = '8px';
  addressEl.style.display = 'flex';
  addressEl.style.alignItems = 'flex-start';
  addressEl.style.gap = '4px';

  const pinIcon = document.createElement('span');
  pinIcon.textContent = '📍';
  addressEl.appendChild(pinIcon);

  const addressTextEl = document.createElement('span');
  const fullAddress = complaint.location?.landmark
    ? `${complaint.location.landmark}, ${complaint.location.address || ''}`
    : complaint.location?.address || 'Location Coordinates Logged';
  addressTextEl.textContent = safeText(fullAddress, 'Municipal Sector');
  addressEl.appendChild(addressTextEl);

  container.appendChild(addressEl);

  // 5. Citizen attribution if present (USER-CONTROLLED - MUST USE textContent)
  if (complaint.citizenName && complaint.citizenName !== 'Anonymous') {
    const citizenEl = document.createElement('div');
    citizenEl.style.fontSize = '10px';
    citizenEl.style.color = '#94a3b8';
    citizenEl.style.marginBottom = '6px';
    citizenEl.textContent = `Reported by: ${safeText(complaint.citizenName)}`;
    container.appendChild(citizenEl);
  }

  // 6. Meta: Status and Action Button
  const footer = document.createElement('div');
  footer.style.display = 'flex';
  footer.style.alignItems = 'center';
  footer.style.justifyContent = 'space-between';
  footer.style.paddingTop = '6px';
  footer.style.borderTop = '1px solid #e2e8f0';
  footer.style.gap = '8px';

  const statusEl = document.createElement('span');
  statusEl.style.fontWeight = '700';
  statusEl.style.fontSize = '10px';
  statusEl.style.textTransform = 'uppercase';
  statusEl.style.letterSpacing = '0.025em';
  const isResolved = complaint.status === 'resolved';
  const isInProgress = complaint.status === 'in_progress';
  statusEl.style.color = isResolved ? '#059669' : isInProgress ? '#2563eb' : '#d97706';
  statusEl.textContent = `Status: ${complaint.status.replace('_', ' ')}`;
  footer.appendChild(statusEl);

  if (onSelect) {
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.style.background = '#0f172a';
    actionBtn.style.color = '#ffffff';
    actionBtn.style.border = 'none';
    actionBtn.style.borderRadius = '4px';
    actionBtn.style.padding = '3px 8px';
    actionBtn.style.fontSize = '10px';
    actionBtn.style.fontWeight = '600';
    actionBtn.style.cursor = 'pointer';
    actionBtn.textContent = 'View Details →';
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelect(complaint.id);
    });
    footer.appendChild(actionBtn);
  }

  container.appendChild(footer);
  return container;
}

/**
 * Constructs a DOM-safe InfoWindow container element for a Hotspot.
 */
export function createSafeHotspotInfoWindow(
  hotspot: Hotspot,
  onSelect?: (hotspotId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'google-maps-infowindow-hotspot';
  container.style.fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  container.style.fontSize = '12px';
  container.style.padding = '8px 10px';
  container.style.maxWidth = '270px';
  container.style.color = '#0f172a';
  container.style.lineHeight = '1.4';

  // 1. Header
  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.alignItems = 'center';
  header.style.justifyContent = 'space-between';
  header.style.marginBottom = '6px';

  const clusterTag = document.createElement('span');
  clusterTag.style.fontSize = '10px';
  clusterTag.style.fontWeight = '800';
  clusterTag.style.fontFamily = 'ui-monospace, monospace';
  clusterTag.style.color = '#e11d48';
  clusterTag.textContent = 'POTENTIAL HOTSPOT';

  const riskBadge = document.createElement('span');
  riskBadge.style.fontSize = '10px';
  riskBadge.style.fontWeight = '700';
  riskBadge.style.padding = '2px 6px';
  riskBadge.style.borderRadius = '4px';
  const isCritical = hotspot.riskLevel === 'Critical';
  riskBadge.style.backgroundColor = isCritical ? '#fef2f2' : '#fffbeb';
  riskBadge.style.color = isCritical ? '#b91c1c' : '#b45309';
  riskBadge.style.border = isCritical ? '1px solid #fecaca' : '1px solid #fde68a';
  riskBadge.textContent = `${hotspot.riskLevel} Risk`;

  header.appendChild(clusterTag);
  header.appendChild(riskBadge);
  container.appendChild(header);

  // 2. Name & Location
  const nameEl = document.createElement('div');
  nameEl.style.fontWeight = '700';
  nameEl.style.fontSize = '13px';
  nameEl.style.marginBottom = '2px';
  nameEl.textContent = safeText(hotspot.name, 'Civic Density Cluster');
  container.appendChild(nameEl);

  const locEl = document.createElement('div');
  locEl.style.fontSize = '11px';
  locEl.style.color = '#64748b';
  locEl.style.marginBottom = '6px';
  const radius = hotspot.radius || hotspot.radiusMeters || 400;
  locEl.textContent = `${safeText(hotspot.locationName, 'District')} • ${radius}m radius (${hotspot.complaintCount} reports)`;
  container.appendChild(locEl);

  // 3. Dynamic clustering note
  const noteEl = document.createElement('div');
  noteEl.style.fontSize = '10px';
  noteEl.style.fontStyle = 'italic';
  noteEl.style.color = '#6b7280';
  noteEl.style.marginBottom = '6px';
  noteEl.textContent = safeText(hotspot.detectionNote, 'Potential hotspot detected from repeated reports.');
  container.appendChild(noteEl);

  // 4. Action Button
  if (onSelect) {
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.style.width = '100%';
    actionBtn.style.marginTop = '6px';
    actionBtn.style.background = '#0f172a';
    actionBtn.style.color = '#ffffff';
    actionBtn.style.border = 'none';
    actionBtn.style.borderRadius = '4px';
    actionBtn.style.padding = '5px 10px';
    actionBtn.style.fontSize = '11px';
    actionBtn.style.fontWeight = '600';
    actionBtn.style.cursor = 'pointer';
    actionBtn.textContent = 'Inspect Hotspot Cluster →';
    actionBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      onSelect(hotspot.id);
    });
    container.appendChild(actionBtn);
  }

  return container;
}
