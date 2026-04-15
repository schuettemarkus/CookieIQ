import React from 'react';
import { CATEGORY_PILL } from '../lib.js';

export default function CategoryBadge({ category }) {
  const cls = CATEGORY_PILL[category] || CATEGORY_PILL.Unknown;
  return <span className={cls}>{category || 'Unknown'}</span>;
}
