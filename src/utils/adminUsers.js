// Lista de correos autorizados para acceder al panel admin
export const ADMIN_EMAILS = [
  'informatica@colegiomariano.cl',
  'test.test@colegiomariano.cl',
  'biblioteca@colegiomariano.cl'
  // Agrega más correos aquí
];

export const isAdmin = (userEmail) => {
  return ADMIN_EMAILS.includes(userEmail);
};