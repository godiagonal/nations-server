module.exports = {
    socketOptions: {
        origins: 'http://nations.c2h4imtcm2.eu-west-1.elasticbeanstalk.com:* http://localhost:* http://127.0.0.1:*'
    },
    apiOptions: {
        origins: [
            'http://localhost:4200',
            'http://godiagonal.com',
            'http://nations.godiagonal.com'
        ]
    },
    defaultTimezone: 'Europe/Stockholm'
}