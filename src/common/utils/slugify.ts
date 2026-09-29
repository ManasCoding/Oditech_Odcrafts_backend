import slugifyModule from 'slugify';

export const slugify = (text: string) => {
  return slugifyModule(text, {
    lower: true,
    strict: true,
    trim: true
  });
};
