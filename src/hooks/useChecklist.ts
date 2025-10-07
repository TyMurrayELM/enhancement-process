'use client';

import { useState } from 'react';

export function useChecklist() {
  const [beforePhotoLink, setBeforePhotoLink] = useState('');
  const [beforePhotoDate, setBeforePhotoDate] = useState<string | null>(null);
  const [progressPhotoLinks, setProgressPhotoLinks] = useState<Array<{ link: string; addedDate: string }>>([]);

  const handleBeforePhotoChange = (value: string) => {
    setBeforePhotoLink(value);
    if (value.trim() && !beforePhotoDate) {
      setBeforePhotoDate(new Date().toISOString());
    } else if (!value.trim()) {
      setBeforePhotoDate(null);
    }
  };

  const addProgressLink = (link: string) => {
    if (link.trim()) {
      setProgressPhotoLinks([
        ...progressPhotoLinks,
        { link: link.trim(), addedDate: new Date().toISOString() }
      ]);
    }
  };

  const removeProgressLink = (index: number) => {
    setProgressPhotoLinks(progressPhotoLinks.filter((_, i) => i !== index));
  };

  return {
    beforePhotoLink,
    beforePhotoDate,
    progressPhotoLinks,
    handleBeforePhotoChange,
    addProgressLink,
    removeProgressLink,
    setBeforePhotoLink,
    setProgressPhotoLinks
  };
} 
