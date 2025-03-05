const ldap = require('ldapjs');

const config = {
    url: 'ldap://alkaloidad.local', // Линк до LDAP серверот
    baseDN: 'OU=Alkaloid Users,OU=Alkaloid,DC=Alkaloid,DC=local', // LDAP патека
    username: 'mnikolov@alkaloid.com.mk',
    password: 'Isukowwl21!',
    searchDN: 'CN=admin,OU=Alkaloid Users,OU=Alkaloid,DC=Alkaloid,DC=local', // Пример за DN на администратор
    searchPassword: '123Vla000!'
};
