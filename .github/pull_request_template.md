## Описание

Опишите, что изменено в этом PR и почему.

## Тип изменения

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🔧 Refactoring (no functional changes)
- [ ] ⚙️ Infrastructure / CI/CD

## Чеклист блочной архитектуры

### Обязательные проверки для изменений блоков

- [ ] Обновлены shared DTO/типы при изменении контрактов?
  - Если изменяются API контракты, убедитесь, что `packages/shared` обновлен
  - Проверьте, что все типы и Zod схемы синхронизированы
  
- [ ] Обновлена версия блока?
  - Версия блока обновлена согласно Semantic Versioning (MAJOR.MINOR.PATCH)
  - Изменения зарегистрированы в `docs/block-registry.md`
  
- [ ] Есть rollback plan?
  - Описана стратегия отката изменений
  - Rollback plan добавлен в описание блока в `docs/block-registry.md`
  - Для критических изменений проверен план отката

### Дополнительные проверки

- [ ] Код соответствует архитектурным принципам (см. `ARCHITECTURE.md`)
- [ ] Добавлены/обновлены тесты (если применимо)
- [ ] Обновлена документация (если применимо)
- [ ] Проверка безопасности (RBAC, validation, audit log для админ-действий)
- [ ] Проверена работа миграций (если добавлены/изменены)

## Тестирование

Опишите, как вы тестировали изменения:
- [ ] Локальное тестирование
- [ ] Проверка на staging (если доступно)
- [ ] Проверка rollback процедуры

## Связанные блоки

Перечислите блоки, которые затрагивает этот PR (если применимо):
- BlockName / Category / Version

## Скриншоты / Примеры

Добавьте скриншоты или примеры использования (если применимо).

## Checklist перед merge

- [ ] Все проверки CI/CD пройдены
- [ ] Code review получен и одобрен
- [ ] Документация обновлена
- [ ] Версия блока обновлена в `docs/block-registry.md`
- [ ] Rollback plan описан и проверен

