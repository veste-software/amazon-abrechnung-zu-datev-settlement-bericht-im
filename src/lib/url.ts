// Every internal link and asset path goes through withBase(), so the site works both at '/'
// and under a sub-path such as the GitHub Pages preview '/<repo>/'.
export function joinBase(base: string, path = '/'): string {
  const b = base.endsWith('/') ? base.slice(0, -1) : base;
  if (/^[a-z]+:\/\//i.test(path) || path.startsWith('#') || path.startsWith('mailto:')) return path;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${b}${p}` || '/';
}

export function withBase(path = '/'): string {
  return joinBase(import.meta.env.BASE_URL ?? '/', path);
}
