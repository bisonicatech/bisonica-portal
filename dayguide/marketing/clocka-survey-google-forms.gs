/**
 * Creates the Clocka survey in your Google Forms.
 *
 * 1. Go to https://script.google.com and tap "New project".
 * 2. Delete the sample code, paste ALL of this file in, and tap Save.
 * 3. Make sure "createClockaSurvey" is selected at the top, then tap Run.
 * 4. The first time, Google asks for permission to create a form: allow it.
 * 5. Open View → Logs (or "Execution log"): it shows the link to share and the
 *    link to edit. The form also appears in your Google Forms and Google Drive.
 */
function createClockaSurvey() {
  var form = FormApp.create('Helping families living with dementia: 2-minute survey');
  form.setDescription(
    "We're a small UK family team building Clocka, a simple phone app that helps someone living with dementia " +
      'know what time of day it is and what to do now, and lets their family help from their own phones.\n\n' +
      "We'd love to hear what would really help you. The survey takes about 2 minutes and is anonymous. Thank you."
  );
  form.setCollectEmail(false);
  form.setProgressBar(true);
  form.setAllowResponseEdits(false);
  form.setConfirmationMessage(
    "Thank you, that really helps. If you left your email, we'll be in touch when Clocka is ready. " +
      "For dementia support now, Alzheimer's Society's Dementia Support Line is 0333 150 3456."
  );

  form.addMultipleChoiceItem()
    .setTitle('1. Which best describes you?')
    .setChoiceValues([
      'I care for a family member or partner living with dementia',
      "I'm a paid or professional carer",
      "I'm living with dementia or memory problems myself",
      "I'm a friend or relative who helps out",
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('2. Where does the person you support live?')
    .setChoiceValues([
      'In their own home, on their own',
      'In their own home, with a partner or family',
      'With me',
      'In a care home or supported living',
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addScaleItem()
    .setTitle('3. How much does confusion about the time or day affect daily life?')
    .setBounds(1, 5)
    .setLabels('Not at all', 'A great deal')
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('4. Which of these happen, at least sometimes?')
    .setHelpText('Tick all that apply.')
    .setChoiceValues([
      "Getting up in the night, thinking it's morning",
      'Asking again and again what day or time it is',
      'Missing meals, medication or appointments',
      'Not sure what to do next during the day',
      "Worry when they're left on their own",
      "Hard to check they're okay when you're not there",
      'Getting lost when out',
      'None of these',
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('5. Which would help most?')
    .setHelpText('Choose up to 3.')
    .setChoiceValues([
      'A big, clear clock showing morning, afternoon, evening or night',
      'One simple message for what to do now, e.g. "Time for lunch"',
      'Gentle reminders for meals, medication or appointments',
      'A calm "it\'s still night-time, go back to bed" message',
      'Changing their reminders from my own phone',
      'A message on their screen when I go out ("Back at 3pm")',
      '"Are you okay?" check-ins that alert me if there\'s no answer',
      'A one-tap button to phone or video call family',
      'An "I\'m lost" button that shares their location with family',
    ])
    .showOtherOption(true)
    .setValidation(FormApp.createCheckboxValidation().requireSelectAtMost(3).build())
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('6. What would the person use Clocka on?')
    .setChoiceValues([
      'Their own smartphone, which they carry with them',
      'A tablet or spare phone kept at home',
      "They don't use phones or tablets",
      'Not sure',
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addScaleItem()
    .setTitle('7. How confident is the person with using a phone?')
    .setBounds(1, 5)
    .setLabels('Not at all', 'Very confident')
    .setRequired(true);

  form.addCheckboxItem()
    .setTitle('8. What do you use now to help with the time, day or reminders?')
    .setHelpText('Tick all that apply.')
    .setChoiceValues([
      'A dementia clock or day clock',
      'A reminder or calendar app',
      'A smart speaker (Alexa, Google)',
      'A whiteboard, notes or paper calendar',
      'Phone calls or visits through the day',
      'Nothing at the moment',
    ])
    .showOtherOption(true)
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('9. What would you expect to pay for an app like this, covering the whole family?')
    .setChoiceValues([
      "I'd only use a free app",
      'Up to £1.99 a month',
      '£2 to £3.99 a month',
      '£4 to £6.99 a month',
      '£7 or more a month',
      'It depends on what it does',
    ])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('10. What one thing would make the biggest difference to you or the person you support?')
    .setRequired(false);

  form.addTextItem()
    .setTitle("11. Would you like to try Clocka free when it's ready? Leave your email and we'll let you know.")
    .setHelpText("Optional. We'll only use it to tell you about Clocka, and you can ask us to delete it at any time (info@clocka.co.uk).")
    .setValidation(FormApp.createTextValidation().requireTextIsEmail().build())
    .setRequired(false);

  Logger.log('Share this link: ' + form.getPublishedUrl());
  Logger.log('Edit the form here: ' + form.getEditUrl());
}
