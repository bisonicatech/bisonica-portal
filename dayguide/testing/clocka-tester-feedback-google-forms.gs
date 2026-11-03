/**
 * Creates the Clocka tester feedback form in your Google Forms.
 *
 * 1. Go to https://script.google.com and tap "New project".
 * 2. Delete the sample code, paste ALL of this file in, and tap Save.
 * 3. Make sure "createClockaTesterFeedback" is selected at the top, then tap Run.
 * 4. The first time, Google asks for permission: allow it (Advanced → Go to project).
 * 5. Open "Execution log": it shows the link to send testers and the link to edit.
 */
function createClockaTesterFeedback() {
  var form = FormApp.create('Clocka beta: tester feedback');
  form.setDescription(
    'Thank you for testing Clocka! This takes about 5 minutes. ' +
      'Please send screenshots or screen recordings to info@clocka.co.uk with your name and phone model.'
  );
  form.setCollectEmail(false);
  form.setProgressBar(true);
  form.setConfirmationMessage('Thank you, that really helps. If you have screenshots, please email them to info@clocka.co.uk.');

  // About you and your phone
  form.addSectionHeaderItem().setTitle('About you and your phone');
  form.addTextItem().setTitle('Your name').setHelpText('So we can follow up on anything you found.').setRequired(true);
  form.addMultipleChoiceItem()
    .setTitle('Which phone did you test on?')
    .setChoiceValues(['iPhone', 'Android'])
    .setRequired(true);
  form.addTextItem()
    .setTitle('Phone model and software version')
    .setHelpText('e.g. iPhone 13, iOS 18, or Samsung Galaxy A15, Android 14. (iPhone: Settings → General → About. Android: Settings → About phone.)')
    .setRequired(true);
  form.addCheckboxItem()
    .setTitle('Which role did your phone play?')
    .setChoiceValues(['Phone B: the clock (person being cared for)', 'Phone A: the family phone', 'Both, at different times'])
    .setRequired(true);
  form.addMultipleChoiceItem()
    .setTitle('Who did you test with?')
    .setChoiceValues(['Someone at home', 'A friend', 'Jason', 'On my own'])
    .showOtherOption(true)
    .setRequired(true);

  // The tests
  form.addPageBreakItem().setTitle('The tests').setHelpText('For each test, did it work as expected?');
  form.addGridItem()
    .setTitle('How did each test go?')
    .setRows([
      '1. Install the app',
      '2. Set up and link the two phones',
      '3. Read the clock',
      '4. Change the message from the family phone',
      '5. Reminder sound at the set time',
      '6. Night-time (dark, silent, no Call button)',
      '7. Out mode message on the clock',
      '8. "Are you okay?" check-in (iPhone)',
      '9. Missed check-in alert (iPhone)',
      '10. Call button',
      '11. Open the clock\'s settings (hold 3 seconds + PIN)',
      '12. Back button (Android)',
      '13. Try Premium (iPhone)',
      '14. Help and Privacy pages',
      '15. Delete the test data',
    ])
    .setColumns(['Worked', 'Worked, but confusing', "Didn't work", "Didn't try"])
    .setRequired(true);
  form.addParagraphTextItem()
    .setTitle("What didn't work, or was confusing?")
    .setHelpText('Say which test number, what you did, what you expected and what happened instead.')
    .setRequired(false);

  // Overall
  form.addPageBreakItem().setTitle('Overall');
  form.addScaleItem()
    .setTitle('How easy was the clock to read and understand?')
    .setBounds(1, 5)
    .setLabels('Very hard', 'Very easy')
    .setRequired(true);
  form.addScaleItem()
    .setTitle('How easy was the family phone to use?')
    .setBounds(1, 5)
    .setLabels('Very hard', 'Very easy')
    .setRequired(true);
  form.addScaleItem()
    .setTitle('How likely are you to recommend Clocka to a family living with dementia?')
    .setBounds(0, 10)
    .setLabels('Not at all likely', 'Extremely likely')
    .setRequired(true);
  form.addParagraphTextItem().setTitle('What did you like most?').setRequired(false);
  form.addParagraphTextItem().setTitle('What one thing would you change or add?').setRequired(false);
  form.addMultipleChoiceItem()
    .setTitle('Would you be happy to keep testing new versions (for about 2 more weeks)?')
    .setHelpText('Android testers: Google needs 12 testers to keep the app installed for 14 days before it can go on the Play Store.')
    .setChoiceValues(['Yes', 'Maybe', 'No thanks'])
    .setRequired(true);
  form.addTextItem()
    .setTitle('Android testers: the Gmail address on your phone (optional)')
    .setHelpText('Only needed so we can invite you to the Google Play test. We use it only for Clocka testing.')
    .setValidation(FormApp.createTextValidation().requireTextIsEmail().build())
    .setRequired(false);

  Logger.log('Send this link to testers: ' + form.getPublishedUrl());
  Logger.log('Edit the form here: ' + form.getEditUrl());
}
