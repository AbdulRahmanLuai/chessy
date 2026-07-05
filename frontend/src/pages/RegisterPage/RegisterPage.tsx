import RegisterForm from '@/features/auth/RegisterForm';
import styles from './RegisterPage.module.css';
import { useNavigate } from 'react-router-dom';

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.root}>
      <RegisterForm onSuccess={() => navigate('/lobby')} />
    </div>
  );
}