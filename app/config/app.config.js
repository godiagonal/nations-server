module.exports = {
    socketOptions: {
        origins: 'http://localhost:* http://127.0.0.1:*'
    },
    apiOptions: {
        origins: [
            'http://localhost:4200',
            'http://godiagonal.com'
        ]
    },
    defaultTimezone: 'Europe/Stockholm'
}