import {bootstrapApplication} from '@angular/platform-browser';
import {App} from './app/app';
import {appConfig} from './app/app.config';
import {runAllTests} from './tests/test-registry';

// Запускаем наши тесты ядра прямо в консоли браузера при старте приложения
console.log('%c🚀 ЗАПУСК ТЕСТОВОЙ ИНФРАСТРУКТУРЫ CHEMCORE...', 'color: #8b5cf6; font-weight: bold; font-size: 14px;');
runAllTests();
console.log('%c✅ ВСЕ ТЕСТЫ ЗАВЕРШЕНЫ. ЗАПУСК UI...', 'color: #8b5cf6; font-weight: bold; font-size: 14px;');

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
