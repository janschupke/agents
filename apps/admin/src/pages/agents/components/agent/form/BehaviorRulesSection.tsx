import { useTranslation, I18nNamespace } from '@openai/i18n';
import { Button, Input } from '@openai/ui';

interface BehaviorRulesSectionProps {
  behaviorRules: string[];
  newBehaviorRule: string;
  onNewRuleChange: (value: string) => void;
  onAddRule: () => void;
  onRemoveRule: (index: number) => void;
}

export default function BehaviorRulesSection({
  behaviorRules,
  newBehaviorRule,
  onNewRuleChange,
  onAddRule,
  onRemoveRule,
}: BehaviorRulesSectionProps) {
  const { t } = useTranslation(I18nNamespace.ADMIN);

  return (
    <div>
      <label className="block text-sm font-medium text-text-primary mb-1">
        {t('archetypes.form.behaviorRules')}
      </label>
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newBehaviorRule}
            onChange={(e) => onNewRuleChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAddRule();
              }
            }}
            placeholder={t('archetypes.form.addRule')}
          />
          <Button type="button" onClick={onAddRule} size="sm">
            {t('archetypes.form.add')}
          </Button>
        </div>
        {behaviorRules.length > 0 && (
          <div className="space-y-1">
            {behaviorRules.map((rule, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-background rounded border border-border"
              >
                <span className="flex-1 text-sm text-text-primary">{rule}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveRule(index)}
                  className="text-danger hover:text-danger-hover"
                >
                  {t('archetypes.form.remove')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
