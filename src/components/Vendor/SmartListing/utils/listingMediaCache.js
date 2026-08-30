const cache = new Map();

function groupsHaveFiles(groups) {
  return (groups || []).some((g) =>
    (g.media || []).some((f) => f instanceof File),
  );
}

export function stashListingMedia(id, state) {
  if (!id || !state) return;
  cache.set(id, {
    files: Array.isArray(state.files) ? state.files : [],
    mediaLabels: state.mediaLabels || [],
    brandAuthFile: state.brandAuthFile || null,
    colorGroups: state.colorGroups || [],
  });
}

export function peekListingMedia(id) {
  return cache.get(id) || null;
}

export function stripFilesForDraft(state) {
  const { files, brandAuthFile, ...rest } = state || {};
  const colorGroups = (rest.colorGroups || []).map((g) => ({
    ...g,
    media: (g.media || []).filter((f) => !(f instanceof File)).length
      ? g.media.filter((f) => !(f instanceof File))
      : [],
  }));
  return { ...rest, colorGroups };
}

export function mergeCachedMedia(id, payload, prev = {}) {
  const cached = cache.get(id);
  const next = { ...(payload || {}) };

  const prevFiles = (prev.files || []).filter((f) => f instanceof File);
  const cachedFiles = (cached?.files || []).filter((f) => f instanceof File);
  const payloadFiles = (next.files || []).filter((f) => f instanceof File);
  next.files = payloadFiles.length
    ? payloadFiles
    : prevFiles.length
      ? prevFiles
      : cachedFiles;

  if (next.brandAuthFile instanceof File) {
    /* keep */
  } else if (prev.brandAuthFile instanceof File) {
    next.brandAuthFile = prev.brandAuthFile;
  } else if (cached?.brandAuthFile instanceof File) {
    next.brandAuthFile = cached.brandAuthFile;
  }

  if (next.mediaLabels?.length) {
    /* keep */
  } else if (prev.mediaLabels?.length) {
    next.mediaLabels = prev.mediaLabels;
  } else if (cached?.mediaLabels?.length) {
    next.mediaLabels = cached.mediaLabels;
  }

  if (groupsHaveFiles(next.colorGroups)) {
    /* keep */
  } else if (groupsHaveFiles(prev.colorGroups)) {
    next.colorGroups = prev.colorGroups;
  } else if (groupsHaveFiles(cached?.colorGroups)) {
    next.colorGroups = cached.colorGroups;
  }

  return next;
}
