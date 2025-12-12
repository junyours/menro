<?php

return [
    'default' => [
        'writer' => \SimpleSoftwareIO\QrCode\Generator::class,
        'writer_options' => [],
        'backend' => 'gd', // ✅ force GD backend
    ],
];
