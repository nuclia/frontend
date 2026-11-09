# Pass 5 — Security

**Question:** Can this be abused or leak data?

Skip when the diff is styling/copy only with no data, auth or navigation path — say so in one line.

## Load (when relevant)

`angular-developer` only when a touched API needs checking.

## Checklist

- [ ] XSS: no `bypassSecurityTrust*`, `[innerHTML]` or direct DOM writes (`nativeElement.innerHTML`, `document.write`, `eval`) with non-constant data unless sanitized and justified
- [ ] User-controlled URLs bound to `href`/`src`/`navigateByUrl`: no `javascript:` schemes, no open redirects
- [ ] External links with `target="_blank"` have `rel="noopener"`
- [ ] No secrets, tokens or PII in code, logs, `localStorage`/`sessionStorage`, or environment files that ship to the client
- [ ] Client-side guards and hidden UI are UX only: sensitive data or actions must be enforced by the API — flag when the diff relies on the UI alone
- [ ] No inline scripts or styles that would break the Content Security Policy
