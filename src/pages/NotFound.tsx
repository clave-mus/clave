import { Btn } from '../components/ui';
import { useT } from '../i18n';

export default function NotFound() {
  const t = useT();
  return (
    <div className="empty" style={{ marginTop: 40 }}>
      <h1>{t('notFound.title')}</h1>
      <p className="muted">{t('notFound.text')}</p>
      <Btn to="/">{t('common.backHome')}</Btn>
    </div>
  );
}
