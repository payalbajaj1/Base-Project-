module.exports = {
    validScopes: {
        A: 'admin',
        B: 'customer',
        C: 'serviceProvider'
    },
    validScopeLookUp: {
        'admin': 'A',
        'customer': 'B',
        'serviceProvider': 'C'
    },
    encryptionKey: 'EQse7VsE/llKi8myCueeFf8Uhrm3Pi3Kk0PTGzak2oIBTJmetBp6ZuI4qDUrhqe3OTUXn6/gsKOy1q/vwajprQ==',
    jwt: {
        privateKey: 'vo6bAjveMDs37bDKFKwudIT4xKYgvyjvdP3XXgcFaXeIOXKJ/ozZZUcnUq0cz5EqT7uMfELFbjLnYCKhVWOuXLK5RtHn3sgbmRnQhsvQ3ScIJVwGcjvHXslD1SO4Cn151ClxDTJBqjjctXkH8f8LC7C6mb17/WEF5+847cqqrR0=',
        algorithm: 'HS256',
        expiresIn: '1h'
    }
};