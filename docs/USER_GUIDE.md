# DoseBuddy: step-by-step guide

No computer skills needed. Takes about 5 minutes the first time.

## 1. Install Python (one time only)

**Windows**
1. Go to https://www.python.org/downloads/ and click the big yellow **Download Python** button.
2. Open the downloaded file.
3. **Important:** tick the box **"Add python.exe to PATH"** at the bottom, then click **Install Now**.

**Mac:** the same website works. Linux usually has Python already.

## 2. Start DoseBuddy

1. Unzip the DoseBuddy folder you downloaded (right-click, **Extract All**).
2. **Windows:** double-click **`start-windows.bat`**. **Mac/Linux:** run `start-mac-linux.sh`.
3. A black window opens and your web browser opens DoseBuddy. Keep the black window open while you use it.

## 3. Make the daily plan

1. Type the person's name (for example "Amma") and choose the reminder language.
2. Paste or type the doctor's notes, one sentence per medicine.
   Example: `Thyroid tablet 50 mcg early morning empty stomach. Metformin 500 mg after lunch.`
   Not sure? Press **Try an example**.
3. Press **Make my plan**.
4. **Check the list against the real prescription.** Fix any name, dose, time or food rule that is wrong. Press **Make the daily plan** again after changes.
5. Read the **Warnings**. If you see a red one, ask the doctor or pharmacist before changing anything.

## 4. Use it every day

- **Print fridge card:** prints the big colored card.
- **Tick doses:** tap a medicine on the card when it is taken.
- **Copy WhatsApp text:** paste it into a family chat.
- **Spoken reminders:** tick *Speak reminders*, set the three times, and leave the page open. Press **Hear a sample reminder** to test the sound.
- **Bigger text:** makes everything larger.

## 5. Stop DoseBuddy

Close the black window. Your last plan is saved and appears next time.

## Smarter reading (optional)

Install [Ollama](https://ollama.com), then run `ollama pull qwen2.5:1.5b-instruct` in a terminal. DoseBuddy uses it automatically for messy notes. It works without it too.

## Problems?

| Problem | Fix |
|---|---|
| "Python is not installed" | Do step 1 again and tick *Add python.exe to PATH* |
| "Port 8000 is busy" | Close any other DoseBuddy window and try again |
| No spoken reminder | Keep the page open, turn the volume up, and check your computer has a voice for that language |
| A medicine is read wrongly | Fix it in the list. Use one sentence per medicine |

DoseBuddy is a helper, not a doctor. Always confirm with your doctor or pharmacist.
