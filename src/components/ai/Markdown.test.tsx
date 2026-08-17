import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Markdown } from './Markdown';

describe('Markdown', () => {
  it('renderiza negrita, listas, tablas y código inline', () => {
    render(
      <Markdown>
        {`**Resumen**:

* Machazo
* Catrillan

| Toro | Stock |
| --- | --- |
| Machazo | 3.313 |

Código: \`X\` en línea`}
      </Markdown>,
    );

    const resumen = screen.getByText('Resumen');
    expect(resumen.tagName).toBe('STRONG');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);

    expect(screen.getByText('Toro', { selector: 'th' })).toBeInTheDocument();
    expect(screen.getByText('3.313', { selector: 'td' })).toBeInTheDocument();

    const codigo = screen.getByText('X');
    expect(codigo.closest('code')).not.toBeNull();
  });

  it('escapa HTML crudo sin inyectarlo', () => {
    render(<Markdown>{`Hola **mundo** <script>alert("xss")</script>`}</Markdown>);

    expect(document.querySelector('script')).toBeNull();
    expect(screen.getByText(/alert\("xss"\)/)).toBeInTheDocument();
  });

  it('no aplica doble fondo al código dentro de bloques con triple backtick', () => {
    const { container } = render(
      <Markdown>{'```js\nconst x = 1;\n```'}</Markdown>,
    );

    const code = container.querySelector('pre > code');
    expect(code).not.toBeNull();
    expect(code?.className).not.toContain('bg-ivory-200');
    expect(code?.className).toContain('language-js');
  });
});
