import SignInForm from '@/features/auth/SignInForm';
import styles from './LoginPage.module.css';
import { useNavigate } from "react-router-dom";
  

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.root}>
      <SignInForm onSuccess={() => navigate('/lobby')} />
    </div>
  );
}